import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { comparePasswordHelper } from '@/common/utils/user.utils';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);

    // valid and compare password
    const isValidPassword = await comparePasswordHelper(pass, user?.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('username/password không hợp lệ');
    }
    // generate token
    const payload = { sub: user?.id, username: user?.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
