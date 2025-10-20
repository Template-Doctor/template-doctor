import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../packages/app/src/utils/logger';

describe('Logger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should format messages with module prefix', () => {
    logger.info('test-module', 'Test message');
    
    expect(consoleLogSpy).toHaveBeenCalled();
    const call = consoleLogSpy.mock.calls[0][0];
    expect(call).toContain('[test-module]');
    expect(call).toContain('Test message');
  });

  it('should pass additional data to console methods', () => {
    const testData = { key: 'value' };
    logger.info('test', 'Message', testData);
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Message'),
      testData
    );
  });

  it('should handle debug level logging', () => {
    logger.debug('debug-module', 'Debug message');
    
    // In test environment, this should log (it's like dev mode)
    expect(consoleDebugSpy).toHaveBeenCalled();
  });

  it('should handle warn level logging', () => {
    logger.warn('warn-module', 'Warning message');
    
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warning message');
  });

  it('should handle error level logging', () => {
    const error = new Error('Test error');
    logger.error('error-module', 'Error occurred', error);
    
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error occurred');
    expect(consoleErrorSpy.mock.calls[0][1]).toBe(error);
  });

  it('should allow configuration updates', () => {
    const config = logger.getConfig();
    expect(config).toHaveProperty('level');
    expect(config).toHaveProperty('timestamps');
    expect(config).toHaveProperty('modulePrefixes');
    
    logger.configure({ timestamps: false });
    const newConfig = logger.getConfig();
    expect(newConfig.timestamps).toBe(false);
  });
});
