/**
 * Application Insights Middleware for Template Doctor
 * 
 * Adds custom telemetry tracking to Express requests with business context.
 * Integrates with the existing structured logger and Application Insights.
 */

import { Request, Response, NextFunction } from 'express';
import { telemetry } from '../services/app-insights.js';
import { createLogger } from '../shared/logger.js';

const logger = createLogger('app-insights-middleware');

interface RequestWithTiming extends Request {
  startTime?: number;
}

/**
 * Middleware to track custom business events and metrics
 */
export function applicationInsightsMiddleware(req: RequestWithTiming, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  req.startTime = startTime;

  // Track the original res.end to capture response information
  const originalEnd = res.end.bind(res);
  let hasEnded = false;

  res.end = function(chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) {
    if (hasEnded) return originalEnd(chunk, encoding as BufferEncoding, cb);
    hasEnded = true;

    const duration = Date.now() - startTime;
    const success = res.statusCode >= 200 && res.statusCode < 400;

    // Track specific business events based on the endpoint
    try {
      trackBusinessEvent(req, res, duration, success);
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to track business event');
    }

    return originalEnd(chunk, encoding as BufferEncoding, cb);
  };

  next();
}

/**
 * Track business-specific events based on API endpoints
 */
function trackBusinessEvent(req: RequestWithTiming, res: Response, duration: number, success: boolean): void {
  const { method, path, body, query } = req;
  const statusCode = res.statusCode;

  // Template Analysis Events
  if (path.includes('/api/v4/analyze-template') && method === 'POST') {
    const repoUrl = body?.repoUrl || 'unknown';
    const ruleSet = body?.ruleSet || query?.ruleSet || 'unknown';
    
    telemetry.trackAnalysis(repoUrl, duration, success, ruleSet);
    
    if (!success) {
      telemetry.trackError(
        new Error(`Analysis failed: ${statusCode}`),
        'template-analysis',
        { repoUrl, ruleSet, statusCode: statusCode.toString() }
      );
    }
  }

  // AZD Deployment Test Events
  if (path.includes('/api/v4/azd-test') && method === 'POST') {
    const repoUrl = body?.repoUrl || 'unknown';
    
    telemetry.trackAzdTest(repoUrl, duration, success);
    
    if (!success) {
      telemetry.trackError(
        new Error(`AZD test failed: ${statusCode}`),
        'azd-deployment-test',
        { repoUrl, statusCode: statusCode.toString() }
      );
    }
  }

  // Authentication Events
  if (path.includes('/api/v4/github-oauth-token')) {
    const event = method === 'POST' ? 'login' : 'token_refresh';
    telemetry.trackAuth(event);
  }

  // GitHub API Proxy Events
  if (path.includes('/api/v4/github/') || path.includes('/api/v4/validation-')) {
    const endpoint = path.replace('/api/v4/', '');
    telemetry.trackGitHubApiCall(endpoint, method, duration, success, statusCode);
  }

  // Critical Error Tracking (5xx errors)
  if (statusCode >= 500) {
    telemetry.trackError(
      new Error(`Server error: ${statusCode}`),
      'http-5xx-error',
      {
        method,
        path,
        statusCode: statusCode.toString(),
        userAgent: req.headers['user-agent'] || 'unknown',
      }
    );
  }

  // Performance Monitoring (slow requests > 5 seconds)
  if (duration > 5000) {
    telemetry.trackError(
      new Error(`Slow request: ${duration}ms`),
      'performance-slow-request',
      {
        method,
        path,
        duration: duration.toString(),
        statusCode: statusCode.toString(),
      }
    );
  }
}

/**
 * Helper function to extract repository information from request
 */
export function extractRepoInfo(req: Request): { owner?: string; repo?: string; repoUrl?: string } {
  const { body, query, params } = req;
  
  return {
    owner: body?.owner || query?.owner || params?.owner,
    repo: body?.repo || query?.repo || params?.repo,
    repoUrl: body?.repoUrl || query?.repoUrl || params?.repoUrl,
  };
}

/**
 * Track custom events for specific routes
 */
export const trackEvent = {
  /**
   * Track successful template validation
   */
  templateValidated: (req: Request, repoUrl: string, validationResults: any) => {
    const { issues, compliant } = validationResults;
    
    telemetry.trackEvent('TemplateValidated', {
      repoUrl,
      issueCount: (issues?.length || 0).toString(),
      compliantCount: (compliant?.length || 0).toString(),
    }, {
      issueCount: issues?.length || 0,
      compliantCount: compliant?.length || 0,
    });
  },

  /**
   * Track GitHub issue creation
   */
  issueCreated: (req: Request, repoUrl: string, issueNumber: number) => {
    telemetry.trackEvent('GitHubIssueCreated', {
      repoUrl,
      issueNumber: issueNumber.toString(),
    });
  },

  /**
   * Track batch scan operations
   */
  batchScanStarted: (req: Request, repoCount: number) => {
    telemetry.trackEvent('BatchScanStarted', {
      repoCount: repoCount.toString(),
    }, {
      repoCount,
    });
  },

  /**
   * Track configuration changes
   */
  configurationChanged: (req: Request, configKey: string) => {
    telemetry.trackEvent('ConfigurationChanged', {
      configKey,
      userAgent: req.headers['user-agent'] || 'unknown',
    });
  },
};