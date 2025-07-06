import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger, type LogContext } from '../../src/worker/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Spy on console methods
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
    };

    logger = new Logger('test-service');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create logger with service name', () => {
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should handle empty service name', () => {
      const emptyLogger = new Logger('');
      expect(emptyLogger).toBeInstanceOf(Logger);
    });
  });

  describe('log levels', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('Test info message')
      );
    });

    it('should log error messages', () => {
      logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Test error message')
      );
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('Test debug message')
      );
    });
  });

  describe('structured logging', () => {
    it('should log with metadata', () => {
      const metadata: LogContext = { userId: '123', operation: 'login' };
      logger.info('User logged in', metadata);
      
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should handle complex metadata objects', () => {
      const complexMetadata: LogContext = {
        userId: '123',
        fileId: 'file-456',
        operation: 'upload',
        metadata: { method: 'POST', url: '/api/login' }
      };
      
      logger.info('Complex log entry', complexMetadata);
      
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    it('should log Error objects', () => {
      const error = new Error('Test error');
      logger.error('An error occurred', error);
      
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should handle error with stack trace', () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      
      logger.error('Stack trace error', error);
      
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('performance logging', () => {
    it('should log timing information', () => {
      const duration = 150;
      
      logger.info('Operation completed', { 
        duration,
        operation: 'file-processing'
      });
      
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('log formatting', () => {
    it('should include timestamp in logs', () => {
      logger.info('Timestamped message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });

    it('should include service name in logs', () => {
      logger.info('Service name test');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('test-service')
      );
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Message with "quotes" and \n newlines';
      logger.info(specialMessage);
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('Message with \\"quotes\\" and \\n newlines')
      );
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional context', () => {
      const childLogger = logger.child({ userId: '123', operation: 'test' });
      
      childLogger.info('Child logger message');
      
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined values', () => {
      logger.info('Null test', { metadata: { value: null } });
      logger.info('Undefined test', { metadata: { value: undefined } });
      
      expect(consoleSpy.info).toHaveBeenCalledTimes(2);
    });

    it('should handle circular references in metadata', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      // Should throw an error due to circular reference
      expect(() => {
        logger.info('Circular reference test', { metadata: circular });
      }).toThrow('Converting circular structure to JSON');
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      
      expect(() => {
        logger.info(longMessage);
      }).not.toThrow();
      
      expect(consoleSpy.info).toHaveBeenCalled();
    });
  });
});