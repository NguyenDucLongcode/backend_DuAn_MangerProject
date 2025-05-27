import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

//passport
import { LocalStrategy } from './passport/local.strategy';
import { JwtStrategy } from './passport/jwt.strategy';

// module
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { TokenUtil } from '@/common/utils/token.utils';
import { MetricsModule } from '@/metrics/metrics.module';

@Module({
  imports: [
    MetricsModule,
    EmailModule,
    PassportModule,
    UsersModule,
    JwtModule.register({
      global: true, // <-- Biến module này thành global (dùng được ở mọi nơi không cần import lại)
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, TokenUtil],
  exports: [AuthService],
})
export class AuthModule {}
