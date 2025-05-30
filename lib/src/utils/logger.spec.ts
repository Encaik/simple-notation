import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import Logger from './logger';

describe('Logger', () => {
  // Spy on console methods
  let consoleInfoSpy: MockInstance;
  let consoleWarnSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    // Reset spies before each test
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should log info messages correctly', () => {
    Logger.info('Test info message');
    expect(consoleInfoSpy).toHaveBeenCalledWith('[INFO] Test info message');

    Logger.info('Test info with context', 'MyContext');
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      '[INFO] [MyContext] Test info with context',
    );
  });

  it('should log warn messages correctly', () => {
    Logger.warn('Test warn message');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Test warn message');

    Logger.warn('Test warn with context', 'AnotherContext');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[WARN] [AnotherContext] Test warn with context',
    );
  });

  it('should log error messages correctly', () => {
    Logger.error('Test error message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Test error message');

    Logger.error('Test error with context', 'ErrorContext');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[ERROR] [ErrorContext] Test error with context',
    );
  });

  it('should log debug messages only when isDebugMode is true', () => {
    // Test when debug mode is true
    Logger.isDebugMode = true;
    Logger.debug('Test debug message');
    expect(consoleWarnSpy).toHaveBeenCalledWith('[DEBUG] Test debug message'); // debug uses console.warn

    Logger.debug('Test debug with context', 'DebugContext');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[DEBUG] [DebugContext] Test debug with context',
    );

    // Test when debug mode is false
    Logger.isDebugMode = false;
    consoleWarnSpy.mockClear(); // Clear calls from true mode

    Logger.debug('This should not be logged');
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    Logger.debug('This with context should not be logged', 'NoDebug');
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});
