import winston from 'winston';
import { config } from './env';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}\n${stack}`;
    }
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// הגדרת transports לפי סביבה
const transports: winston.transport[] = [];

if (config.env === 'dev') {
  // בפיתוח - הדפסה לקונסול עם צבעים
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  );
} else {
  // בפרודקשן - שמירה לקובץ
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat
    })
  );
}

// יצירת logger
const logger = winston.createLogger({
  level: config.env === 'dev' ? 'debug' : 'info',
  format: logFormat,
  transports,
  // הגדרות נוספות
  exitOnError: false,
  silent: false
});

// שכתוב console.log לשימוש בlogger
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

console.log = (...args: any[]) => logger.info(args.join(' '));
console.error = (...args: any[]) => logger.error(args.join(' '));
console.warn = (...args: any[]) => logger.warn(args.join(' '));
console.info = (...args: any[]) => logger.info(args.join(' '));

(console as any).original = originalConsole;

export default logger;