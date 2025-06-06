import { Logger, LogLevel } from '../utils/logger';

jest.mock('chalk', () => ({
  red: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  gray: jest.fn((text) => text),
  cyan: jest.fn((text) => text),
}));

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    Logger.setLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('setLevel', () => {
    it('should set logging level', () => {
      Logger.setLevel(LogLevel.ERROR);
      Logger.info('test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('setVerbose', () => {
    it('should enable verbose logging', () => {
      Logger.setVerbose(true);
      Logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), 'debug message');
    });
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      Logger.info('info message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), 'info message');
    });

    it('should log success messages', () => {
      Logger.success('success message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), 'success message');
    });

    it('should log debug messages', () => {
      Logger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), 'debug message');
    });

    it('should log progress messages', () => {
      Logger.progress('progress message');
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String), 'progress message');
    });
  });
});
