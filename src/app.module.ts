// system
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module'; // primas module
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // rate limiting

// logger
import { LoggingMiddleware } from '@/common/Middlewares/LoggingMiddleware';

import { CoreModule } from './modules/core/core.module';
import { JwtAuthGuard } from './modules/auth/passport/jwt-auth.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// catche
import { CacheModule } from '@nestjs/cache-manager';

import { createKeyv } from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // use ConfigModule global  everywhere in application
      envFilePath: `.env.${process.env.NODE_ENV}`, // Choose file .env follow NODE_ENV
    }),

    CacheModule.registerAsync({
      useFactory: () => {
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({ ttl: 60000, lruSize: 5000 }),
            }),
            createKeyv(process.env.REDIS_URL || 'redis://localhost:6379'),
          ],
        };
      },
    }),

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
