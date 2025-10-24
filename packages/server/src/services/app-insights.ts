/**
 * Application Insights Service for Template Doctor
 * 
 * Provides telemetry, performance monitoring, and error tracking for the Express server.
 * Integrates with Azure Application Insights for production monitoring.
 */

import * as AppInsights from 'applicationinsights';
import { createLogger } from '../shared/logger.js';

const logger = createLogger('app-insights');

interface TelemetryProperties {
  [key: string]: string;
}

interface TelemetryMetrics {
  [key: string]: number;
}

class ApplicationInsightsService {
  private isInitialized = false;
  private client: AppInsights.TelemetryClient | null = null;

  /**
   * Initialize Application Insights with connection string
   */
  initialize(): void {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    
    if (!connectionString) {
      logger.info('Application Insights not configured - telemetry disabled');
      logger.info('Set APPLICATIONINSIGHTS_CONNECTION_STRING to enable telemetry');
      return;
    }

    try {
      // Configure Application Insights
      AppInsights
        .setup(connectionString)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(AppInsights.DistributedTracingModes.AI_AND_W3C);

      // Set cloud role name for better filtering in Azure
      AppInsights.defaultClient.context.tags[AppInsights.defaultClient.context.keys.cloudRole] = 'template-doctor-server';
      AppInsights.defaultClient.context.tags[AppInsights.defaultClient.context.keys.cloudRoleInstance] = process.env.WEBSITE_INSTANCE_ID || 'local';

      // Set build information if available
      if (process.env.BUILD_TAG) {
        AppInsights.defaultClient.commonProperties.buildTag = process.env.BUILD_TAG;
      }
      if (process.env.BUILD_TIMESTAMP) {
        AppInsights.defaultClient.commonProperties.buildTimestamp = process.env.BUILD_TIMESTAMP;
      }

      // Start Application Insights
      AppInsights.start();
      
      this.client = AppInsights.defaultClient;
      this.isInitialized = true;

      logger.info('Application Insights initialized successfully');
      
      // Track startup event
      this.trackEvent('ServerStartup', {
        nodeEnv: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        buildTag: process.env.BUILD_TAG || 'unknown',
      });

    } catch (error: any) {
      logger.error({ err: error }, 'Failed to initialize Application Insights');
    }
  }

  /**
   * Track custom events (e.g., template analysis completed, user actions)
   */
  trackEvent(name: string, properties?: TelemetryProperties, metrics?: TelemetryMetrics): void {
    if (!this.isInitialized || !this.client) return;

    try {
      this.client.trackEvent({
        name,
        properties,
        measurements: metrics,
      });
    } catch (error: any) {
      logger.error({ err: error, eventName: name }, 'Failed to track event');
    }
  }

  /**
   * Track custom metrics (e.g., analysis duration, compliance scores)
   */
  trackMetric(name: string, value: number, properties?: TelemetryProperties): void {
    if (!this.isInitialized || !this.client) return;

    try {
      this.client.trackMetric({
        name,
        value,
        properties,
      });
    } catch (error: any) {
      logger.error({ err: error, metricName: name }, 'Failed to track metric');
    }
  }

  /**
   * Track exceptions with context
   */
  trackException(exception: Error, properties?: TelemetryProperties): void {
    if (!this.isInitialized || !this.client) return;

    try {
      this.client.trackException({
        exception,
        properties,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to track exception');
    }
  }

  /**
   * Track dependencies (external API calls, database operations)
   */
  trackDependency(
    dependencyTypeName: string,
    name: string,
    data: string,
    duration: number,
    success: boolean,
    properties?: TelemetryProperties
  ): void {
    if (!this.isInitialized || !this.client) return;

    try {
      this.client.trackDependency({
        dependencyTypeName,
        name,
        data,
        duration,
        success,
        properties,
      });
    } catch (error: any) {
      logger.error({ err: error, dependencyName: name }, 'Failed to track dependency');
    }
  }

  /**
   * Track page views (for SPA routing if serving frontend)
   */
  trackPageView(name: string, url?: string, properties?: TelemetryProperties): void {
    if (!this.isInitialized || !this.client) return;

    try {
      this.client.trackPageView({
        id: `page-${Date.now()}`, // Required by the interface
        name,
        url,
        properties,
      });
    } catch (error: any) {
      logger.error({ err: error, pageName: name }, 'Failed to track page view');
    }
  }

  /**
   * Flush telemetry data (useful for graceful shutdown)
   */
  async flush(): Promise<void> {
    if (!this.isInitialized || !this.client) return;

    return new Promise((resolve) => {
      // Use a timeout to ensure we don't wait indefinitely
      setTimeout(() => resolve(), 2000);
      try {
        this.client!.flush();
      } catch (error) {
        // Flush failed, but resolve anyway
      }
    });
  }

  /**
   * Get health status of Application Insights
   */
  getHealth(): { initialized: boolean; hasConnectionString: boolean } {
    return {
      initialized: this.isInitialized,
      hasConnectionString: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    };
  }
}

// Singleton instance
export const applicationInsights = new ApplicationInsightsService();

// Helper functions for common telemetry scenarios
export const telemetry = {
  /**
   * Track custom events
   */
  trackEvent(name: string, properties?: TelemetryProperties, metrics?: TelemetryMetrics): void {
    applicationInsights.trackEvent(name, properties, metrics);
  },

  /**
   * Track template analysis operation
   */
  trackAnalysis(repoUrl: string, duration: number, success: boolean, ruleSet?: string): void {
    applicationInsights.trackEvent('TemplateAnalysis', {
      repoUrl,
      ruleSet: ruleSet || 'unknown',
      success: success.toString(),
    }, {
      duration,
    });

    applicationInsights.trackMetric('AnalysisDuration', duration, {
      repoUrl,
      success: success.toString(),
    });
  },

  /**
   * Track AZD deployment test
   */
  trackAzdTest(repoUrl: string, duration: number, success: boolean, resourceCount?: number): void {
    applicationInsights.trackEvent('AzdDeploymentTest', {
      repoUrl,
      success: success.toString(),
    }, {
      duration,
      resourceCount: resourceCount || 0,
    });
  },

  /**
   * Track GitHub API calls
   */
  trackGitHubApiCall(endpoint: string, method: string, duration: number, success: boolean, statusCode?: number): void {
    applicationInsights.trackDependency(
      'GitHub API',
      `${method} ${endpoint}`,
      endpoint,
      duration,
      success,
      {
        method,
        statusCode: statusCode?.toString() || 'unknown',
      }
    );
  },

  /**
   * Track database operations
   */
  trackDatabaseOperation(operation: string, collection: string, duration: number, success: boolean): void {
    applicationInsights.trackDependency(
      'MongoDB',
      `${operation} ${collection}`,
      collection,
      duration,
      success,
      {
        operation,
        collection,
      }
    );
  },

  /**
   * Track user authentication events
   */
  trackAuth(event: 'login' | 'logout' | 'token_refresh', username?: string): void {
    applicationInsights.trackEvent('Authentication', {
      event,
      username: username || 'anonymous',
    });
  },

  /**
   * Track errors with context
   */
  trackError(error: Error, context: string, properties?: TelemetryProperties): void {
    applicationInsights.trackException(error, {
      context,
      ...properties,
    });
  },
};