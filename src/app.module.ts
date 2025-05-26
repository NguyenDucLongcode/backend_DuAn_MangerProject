// system
import {
  ExecutionContext,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module'; // primas module
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // rate limiting
import { LoggingMiddleware } from '@/common/Middlewares/LoggingMiddleware'; // logger
import { CoreModule } from './modules/core/core.module'; // total module
import { JwtAuthGuard } from './modules/auth/passport/jwt-auth.guard'; // jwtAuthGuard

// api homepage /
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { RedisModule } from './redis/redis.module'; // catche
import { CronJobsModule } from './services/cron_Jobs/CronJobs.module'; // cron job
import { AllExceptionsFilter } from './common/http-exception/catch-everything.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // use ConfigModule global  everywhere in application
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`, // Choose file .env follow NODE_ENV
    }),

    RedisModule, // catche

    PrometheusModule.register(), // Monitoring (CPU/RAM)

    // cron job
    CronJobsModule,

    // Config ThrottlerModule for rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
          limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
        },
      ],
      // default config (host = localhost, port = 6379)
      storage: new ThrottlerStorageRedisService(
        process.env.REDIS_URL || 'redis://localhost:6379',
      ),

      getTracker: (req: Record<string, any>, _context: ExecutionContext) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return String(req.headers['x-device-id'] || req.ip);
      },

      generateKey: (
        _context: ExecutionContext,
        trackerString: string,
        _throttlerName: string,
      ) => {
        return trackerString;
      },
    }),

    PrismaModule, // Prisma
    CoreModule, // total module
  ],

  controllers: [AppController],

  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // rate limiting global
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // project api point global
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // register middleware logging
  }
}
