/**
 * Simple logger utility for the Plannr application.
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
};

const logger = {
  debug: (message, data = '') => {
    console.debug(formatMessage(LogLevel.DEBUG, message), data);
  },
  info: (message, data = '') => {
    console.info(formatMessage(LogLevel.INFO, message), data);
  },
  warn: (message, data = '') => {
    console.warn(formatMessage(LogLevel.WARN, message), data);
  },
  error: (message, error = '') => {
    console.error(formatMessage(LogLevel.ERROR, message), error);
  }
};

export default logger;
