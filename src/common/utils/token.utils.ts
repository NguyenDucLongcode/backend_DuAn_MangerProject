import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const EMAIL_SECRET = process.env.JWT_EMAIL_SECRET;
const EMAIL_EXPIRES_IN = process.env.JWT_EMAIL_EXPIRES_IN;

@Injectable()
export class TokenUtil {
  constructor(private jwtService: JwtService) {}

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
}
