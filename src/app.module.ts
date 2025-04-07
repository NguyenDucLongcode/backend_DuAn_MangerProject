// system
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module'; // primas module
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // rate limiting
import { CacheConfigModule } from '@/common/cache/cache.module'; // cache
import { AppController } from './app.controller';
import { AppService } from './app.service';

// logger
import { WinstonModule } from 'nest-winston';
import { winstonLoggerConfig } from './configs/winston-logger.config';
import { LoggerService } from '@/services/logger.service';
import { LoggingMiddleware } from '@/Middlewares/LoggingMiddleware';
import { LoggingInterceptor } from '@/common/interceptors/Logging.interceptor';
import { CoreModule } from './modules/core/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // use  ConfigModule global  everywhere in application
      envFilePath: `.env.${process.env.NODE_ENV}`, // Lựa chọn file .env theo NODE_ENV
    }),

    CacheConfigModule, // config Redis

    WinstonModule.forRoot(winstonLoggerConfig), // Config Winston Logger

    // Config ThrottlerModule for rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10), // default '60000' if process.env.THROTTLE_TTL is undefined
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10), // default '100' if process.env.THROTTLE_LIMIT is undefined
        },
      ],
    }),
    PrismaModule, // Prisma
    CoreModule, // total module
  ],

  controllers: [AppController],

  providers: [
    LoggerService, // Đăng ký LoggerService để sử dụng trong toàn bộ ứng dụng
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // rate limiting global
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],

  exports: [LoggerService], // Export LoggerService nếu cần sử dụng ở module khác
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // Đăng ký middleware logging
  }
}
