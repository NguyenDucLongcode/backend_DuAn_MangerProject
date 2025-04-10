import {
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service'; // primas
import { Request } from 'express';

import { UsersService } from '../users/users.service';

// utils
import {
  comparePasswordHelper,
  hashPasswordHelper,
  removePassword,
} from '@/common/utils/user.utils';
import { TokenUtil } from './../../common/utils/token.utils';

// type
import { User } from './type/type';
import { CreateAuthDto } from './dto/create-auth.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private tokenUtil: TokenUtil,
  ) {}

  // Fuc Check user validity by (email, passworld)
  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(username);
    // valid and compare password
    const isValidPassword = await comparePasswordHelper(pass, user?.password);
    if (!user || !isValidPassword) return null;
    return user;
  }

  // Fuc Handler login User
  login(user: User) {
    const payload = { username: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // Fuc Handler regisster User
  async registerUser(createAuthDto: CreateAuthDto, req: Request) {
    const { email, password } = createAuthDto;

    // token to verify that the email really exists
    const emailVerificationToken =
      this.tokenUtil.generateEmailVerificationToken(email);

    //check user exits by email
    const checkUser = await this.usersService.findByEmail(email);
    if (checkUser) {
      throw new ConflictException('User already exists');
    }

    // hash password
    const hashPassword = await hashPasswordHelper(password);

    const newUse = await this.prisma.user.create({
      data: {
        email,
        password: hashPassword,
      },
    });

    // link verify Email
    const confirmLink = `${process.env.CLIENT_URL}/api/v1/auth/email/verify?token=${emailVerificationToken}`;

    //Sent email authentication to user include:
    // 1. Receiver addres
    // 2. Receiver name (can set update)
    // 3. Link confirm email
    // 4. Expiration time
    await this.emailService.sendConfirmationEmail(
      email,
      email,
      confirmLink,
      this.tokenUtil.tokenEmailExpiresIn(),
    );

    //Return seccessfull result
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Create a new user successfully',
      data: removePassword(newUse),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  // Fuc resent email authentication to user not confirm email
  async resendConfirmationEmail(email: string, req: Request) {
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check user if email is verified
    if (user.isActive === true) {
      throw new BadRequestException('User already verified');
    }

    //  Create token confirm email
    const emailVerificationToken =
      this.tokenUtil.generateEmailVerificationToken(email);

    // link verify Email
    const confirmLink = `${process.env.CLIENT_URL}/api/v1/auth/email/verify?token=${emailVerificationToken}`;

    //Sent email authentication to user include:
    // 1. Receiver addres
    // 2. Receiver name (can set update)
    // 3. Link confirm email
    // 4. Expiration time
    await this.emailService.sendConfirmationEmail(
      email,
      email,
      confirmLink,
      this.tokenUtil.tokenEmailExpiresIn(),
    );

    //Return seccessfull result
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Confirmation email resent successfully',
      data: null,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  // Fuc email authentication by token sent from email
  async confirmEmailVerification(token: string, req: Request) {
    try {
      // Decoded token verify email
      const decoded = this.tokenUtil.decodeEmailVerificationToken(token);
      const email = decoded.email;

      // find user by email, check if activated
      const user = await this.usersService.findByEmail(email);
      if (!user) throw new NotFoundException('User not found');
      if (user.isActive) {
        return { message: 'Email already verified' };
      }

      // update status active of user from DB
      await this.prisma.user.update({
        where: { email },
        data: { isActive: true },
      });

      // Return seccessfull result
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Confirmation email resent successfully',
        data: null,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      };
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Invalid or expired token');
    }
  }
}
