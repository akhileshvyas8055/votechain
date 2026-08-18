import winston from 'winston';
import { env } from './env';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom log format for console
const consoleFormat = printf(({ level, message, timestamp, stack, reqId }) => {
  const req = reqId ? `[ReqID: ${reqId}] ` : '';
  return `${timestamp} ${level}: ${req}${stack || message}`;
});

// Configure Winston logger
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'votechain-backend' },
  transports: [
    // Write all logs with importance level of `error` or higher to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with importance level of `info` or higher to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production then log to the `console` with custom format
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    })
  );
}

// Stream for morgan HTTP request logger
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
