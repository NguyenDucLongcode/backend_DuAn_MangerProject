import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN;

const EMAIL_SECRET = process.env.JWT_EMAIL_SECRET;
const EMAIL_EXPIRES_IN = process.env.JWT_EMAIL_EXPIRES_IN;

const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET;
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN;

const FORGOT_PASSWORD_SECRET = process.env.JWT_FORGOT_PASSWORD_SECRET;
const FORGOT_PASSWORD_EXPIRES_IN = process.env.JWT_FORGOT_PASSWORD_EXPIRES_IN;

@Injectable()
export class TokenUtil {
  constructor(private jwtService: JwtService) {}

  // Email
  generateEmailVerificationToken(email: string): string {
    return this.jwtService.sign(
      { email },
      {
        secret: EMAIL_SECRET,
        expiresIn: EMAIL_EXPIRES_IN || '1h',
      },
    );
  }

  decodeEmailVerificationToken(token: string): { email: string } {
    try {
      return this.jwtService.verify(token, {
        secret: EMAIL_SECRET,
      });
    } catch (err) {
      console.log(err);
      throw new Error('Invalid or expired verification token');
    }
  }

  tokenEmailExpiresIn(): string {
    return EMAIL_EXPIRES_IN || '1h';
  }

  // RefreshToken
  generateRefreshToken(payload: { sub: string; username: string }): string {
    return this.jwtService.sign(payload, {
      secret: REFRESH_TOKEN_SECRET,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN || '7d',
    });
  }

  decodeRefreshToken(token: string): { sub: string; username: string } {
    try {
      return this.jwtService.verify(token, {
        secret: REFRESH_TOKEN_SECRET,
      });
    } catch (err) {
      console.log(err);
      throw new Error('Invalid or expired verification token');
    }
  }

  generateNewToken(payload: { sub: string; username: string }): string {
    return this.jwtService.sign(payload, {
      secret: ACCESS_SECRET,
      expiresIn: ACCESS_EXPIRES_IN || '15m',
    });
  }

  // forgotPassword
  generateForgotPasswordToken(payload: { sub: string }): string {
    return this.jwtService.sign(payload, {
      secret: FORGOT_PASSWORD_SECRET,
      expiresIn: FORGOT_PASSWORD_EXPIRES_IN || '15m',
    });
  }

  decodeForgotPasswordToken(token: string): { sub: string } {
    try {
      return this.jwtService.verify(token, {
        secret: FORGOT_PASSWORD_SECRET,
      });
    } catch (err) {
      console.log(err);
      throw new Error('Invalid or expired verification token');
    }
  }

  tokenForgotPasswordExpiresIn(): string {
    return FORGOT_PASSWORD_EXPIRES_IN || '15m';
  }
}
