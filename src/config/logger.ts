import winston from 'winston';
import { config } from './env';

class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor() {
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

    const transports: winston.transport[] = [];

    if (config.env === 'dev') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat
          )
        })
      );
    } else {
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

    this.logger = winston.createLogger({
      level: config.env === 'dev' ? 'debug' : 'info',
      format: logFormat,
      transports,
      exitOnError: false,
      silent: false
    });

    this.overrideConsole();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public getLogger(): winston.Logger {
    return this.logger;
  }

  private overrideConsole(): void {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    console.log = (...args: any[]) => this.logger.info(args.join(' '));
    console.error = (...args: any[]) => this.logger.error(args.join(' '));
    console.warn = (...args: any[]) => this.logger.warn(args.join(' '));
    console.info = (...args: any[]) => this.logger.info(args.join(' '));

    (console as any).original = originalConsole;
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}

const logger = Logger.getInstance();
export default logger;