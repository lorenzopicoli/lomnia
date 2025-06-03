import winston from "winston";
import type { Format } from "logform";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type MetaInfo = any;

export interface LoggerConfig {
  level: string;
  service?: string;
  environment: "development" | "production" | "test";
  prettyPrint: boolean;
}

const defaultConfig: LoggerConfig = {
  level: process.env.LOG_LEVEL || "info",
  environment: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  prettyPrint: process.env.NODE_ENV !== "production",
};

export class Logger {
  private winston: winston.Logger;
  private config: LoggerConfig;

  constructor(service?: string, config: Partial<LoggerConfig> = {}) {
    this.config = {
      ...defaultConfig,
      ...config,
      service: service || config.service,
    };
    this.winston = this.createWinstonLogger();
  }

  private createWinstonLogger(): winston.Logger {
    const formats: Format[] = [
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
      winston.format.errors({ stack: true }),
    ];

    let consoleFormat: Format;

    if (this.config.prettyPrint) {
      consoleFormat = winston.format.combine(
        ...formats,
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const serviceTag = service ? `[${service}]` : "";
          const hasMetadata = Object.keys(meta).length > 0;
          const metaStr = hasMetadata ? `\n${JSON.stringify(meta, null, 2)}` : "";
          return `${timestamp} ${level} ${serviceTag} ${message}${metaStr}`;
        }),
      );
    } else {
      consoleFormat = winston.format.combine(...formats, winston.format.json());
    }

    return winston.createLogger({
      level: this.config.level,
      transports: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
      exitOnError: false,
    });
  }

  private log(level: string, message: string, meta: MetaInfo = {}) {
    this.winston.log(level, message, {
      service: this.config.service,
      ...meta,
    });
  }

  public debug(message: string, meta: MetaInfo = {}) {
    this.log("debug", message, meta);
  }

  public info(message: string, meta: MetaInfo = {}) {
    this.log("info", message, meta);
  }

  public warn(message: string, meta: MetaInfo = {}) {
    this.log("warn", message, meta);
  }

  public error(message: string, meta: MetaInfo = {}) {
    this.log("error", message, meta);
  }

  public logError(operation: string, error: Error, duration?: number, meta: MetaInfo = {}) {
    const logMeta = {
      error: error.message,
      stack: error.stack,
      ...(duration && { duration }),
      ...meta,
    };
    this.error(`${operation} failed`, logMeta);
  }

  public logDuration(operation: string, startTime: number, meta: MetaInfo = {}) {
    const duration = Date.now() - startTime;
    this.info(`${operation} completed`, { duration, ...meta });
  }

  public setLevel(level: string) {
    this.config.level = level;
    this.winston.level = level;
  }

  public getLevel(): string {
    return this.config.level;
  }

  public getService(): string | undefined {
    return this.config.service;
  }

  public child(additionalService?: string, additionalConfig: Partial<LoggerConfig> = {}): Logger {
    const newService = additionalService
      ? this.config.service
        ? `${this.config.service}:${additionalService}`
        : additionalService
      : this.config.service;

    return new Logger(newService, {
      ...this.config,
      ...additionalConfig,
    });
  }

  public timer(operation: string): Timer {
    return new Timer(this, operation);
  }
}

export class Timer {
  private startTime: number;

  constructor(
    private logger: Logger,
    private operation: string,
  ) {
    this.startTime = Date.now();
    this.logger.debug(`Starting timer for ${operation}`);
  }

  public end(meta: MetaInfo = {}) {
    const duration = Date.now() - this.startTime;
    this.logger.info(`${this.operation} completed`, { duration, ...meta });
    return duration;
  }

  public endWithError(error: Error, meta: MetaInfo = {}) {
    const duration = Date.now() - this.startTime;
    this.logger.logError(this.operation, error, duration, meta);
    return duration;
  }
}
