import { Injectable } from '@nestjs/common';
import { createLogger, Logger } from 'winston';
import { winstonLoggerConfig } from '@/configs/winston-logger.config';

@Injectable()
export class LoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger(winstonLoggerConfig);
  }

  log(message: string) {
    this.logger.info(message);
  }

  error(message: string) {
    this.logger.error(message);
  }

  warn(message: string) {
    this.logger.warn(message);
  }

  debug(message: string) {
    this.logger.debug(message);
  }
}
