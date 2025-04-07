import * as winston from 'winston';
import { WinstonModuleOptions } from 'nest-winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as fs from 'fs';
import * as path from 'path';

// Kiểm tra và tạo thư mục logs nếu chưa có
const logDirectory = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const levelFilter = (level: string) =>
  winston.format((info) => (info.level === level ? info : false))();

// Config Winston Logger
export const winstonLoggerConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Format thời gian đẹp hơn
        winston.format.printf((info) => {
          const timestamp =
            typeof info.timestamp === 'string'
              ? info.timestamp
              : new Date().toISOString();
          return `[${timestamp}] ${info.level}: ${String(info.message)}`;
        }),
      ),
    }),

    // Transport cho error log
    new DailyRotateFile({
      filename: path.join(logDirectory, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error', // Chỉ log lỗi
      format: winston.format.combine(
        levelFilter('error'),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxFiles: '14d', // Giữ lại 14 ngày log lỗi
    }),

    // Transport cho combined log
    new DailyRotateFile({
      filename: path.join(logDirectory, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info', // Log tất cả các loại log từ mức info trở lên
      format: winston.format.combine(
        levelFilter('info'),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxFiles: '30d', // Giữ lại 30 ngày log kết hợp
    }),

    // Transport cho debug log
    new DailyRotateFile({
      filename: path.join(logDirectory, 'debug-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug', // Chỉ log debug
      format: winston.format.combine(
        levelFilter('debug'),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxFiles: '7d', // Giữ lại 7 ngày log debug
    }),

    // Transport cho warn log
    new DailyRotateFile({
      filename: path.join(logDirectory, 'warn-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'warn', // Chỉ log warn
      format: winston.format.combine(
        levelFilter('warn'),
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxFiles: '14d', // Giữ lại 14 ngày log cảnh báo
    }),
  ],
};
