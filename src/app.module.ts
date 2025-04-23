// system
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // use ConfigModule global  everywhere in application
      envFilePath: `.env.${process.env.NODE_ENV}`, // Choose file .env follow NODE_ENV
    }),

    RedisModule, // catche

    // cron job
    CronJobsModule,

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
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // rate limiting global
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // project api point global
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*'); // register middleware logging
  }
}
