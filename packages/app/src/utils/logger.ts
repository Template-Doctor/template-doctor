/**
 * Frontend logging utility for Template Doctor
 *
 * Provides environment-aware logging that:
 * - **Development (Vite dev server)**: Logs everything to console
 * - **Production (built bundle)**: Only logs errors, all other logs suppressed
 *
 * This ensures clean production logs while keeping full debugging in development.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.debug('auth', 'User logged in', { userId: 123 });  // Dev only
 *   logger.info('api', 'Fetching template data');              // Dev only
 *   logger.warn('validation', 'Invalid input detected');       // Dev only
 *   logger.error('network', 'API request failed', error);      // Always logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  /**
   * Minimum log level to display
   * debug: All messages
   * info: Info, warn, error
   * warn: Warn, error only
   * error: Errors only
   */
  level: LogLevel;
  
  /**
   * Enable timestamps in log messages
   */
  timestamps: boolean;
  
  /**
   * Enable module prefixes in log messages
   */
  modulePrefixes: boolean;
}

class Logger {
  private config: LoggerConfig;
  private isDev: boolean;
  
  constructor() {
    // Determine if we're in development (Vite dev server)
    // In production build, import.meta.env.DEV is false
    this.isDev = import.meta.env.DEV;
    
    this.config = {
      level: this.isDev ? 'debug' : 'error', // Production: errors only
      timestamps: this.isDev,
      modulePrefixes: true,
    };
  }
  
  /**
   * Check if a log level should be displayed
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
  
  /**
   * Format log message with optional timestamp and module prefix
   */
  private formatMessage(module: string, message: string): string {
    const parts: string[] = [];
    
    if (this.config.timestamps) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    if (this.config.modulePrefixes && module) {
      parts.push(`[${module}]`);
    }
    
    parts.push(message);
    return parts.join(' ');
  }
  
  /**
   * Debug-level logging (development only)
   */
  debug(module: string, message: string, ...data: unknown[]): void {
    if (!this.shouldLog('debug')) return;
    
    // eslint-disable-next-line no-console
    console.debug(this.formatMessage(module, message), ...data);
  }
  
  /**
   * Info-level logging
   */
  info(module: string, message: string, ...data: unknown[]): void {
    if (!this.shouldLog('info')) return;
    
    // eslint-disable-next-line no-console
    console.log(this.formatMessage(module, message), ...data);
  }
  
  /**
   * Warning-level logging (always logged)
   */
  warn(module: string, message: string, ...data: unknown[]): void {
    if (!this.shouldLog('warn')) return;
    
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage(module, message), ...data);
  }
  
  /**
   * Error-level logging (always logged)
   */
  error(module: string, message: string, ...data: unknown[]): void {
    if (!this.shouldLog('error')) return;
    
    // eslint-disable-next-line no-console
    console.error(this.formatMessage(module, message), ...data);
  }
  
  /**
   * Update logger configuration at runtime
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for testing/customization
export type { LogLevel, LoggerConfig };
