/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service'; // primas
import { Request, Response } from 'express';

import { UsersService } from '../users/users.service';

// utils
import {
  comparePasswordHelper,
  hashPasswordHelper,
  removePassword,
} from '@/common/utils/user.utils';
import { TokenUtil } from './../../common/utils/token.utils';

// type
import { JwtDecodedPayload, User } from './type/type';
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
  async login(user: User, res: Response, deviceId: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    const payload = { username: user.email, sub: user.id, role: user.role };

    // Check if a refresh token has been revoked for this device
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { userId_deviceId: { userId: user.id, deviceId } },
    });

    const refreshToken: string = this.tokenUtil.generateRefreshToken(payload);

    if (!existingToken) {
      // No old token → create new one
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          deviceId,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      // Have old token → update token and reset revoked
      await this.prisma.refreshToken.update({
        where: { userId_deviceId: { userId: user.id, deviceId } },
        data: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked: false,
        },
      });
    }

    // Save refreshToken to cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction, //  Chỉ bật secure khi production
      sameSite: isProduction ? 'strict' : 'lax', // Tránh lỗi CORS trong dev
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });

    // Set cookie
    res.cookie('access_token', this.jwtService.sign(payload), {
      httpOnly: true,
      secure: isProduction, //  Chỉ bật secure khi production
      sameSite: isProduction ? 'strict' : 'lax', // Tránh lỗi CORS trong dev
      maxAge: 15 * 60 * 1000, // 15 phút
    });

    return {
      message: 'Login successfully',
      access_token: this.jwtService.sign(payload),
    };
  }

  // Fuc Logout
  async logout(req: Request, res: Response, deviceId: string) {
    // check client side device id
    if (!deviceId) {
      throw new UnauthorizedException('Missing device ID');
    }

    // Check refresh token
    const cookies = req.cookies as { refresh_token?: string };
    const refreshToken = cookies.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    try {
      const isProduction = process.env.NODE_ENV === 'production';

      // Check if refresh token exists in database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Refresh token not found');
      }

      // Check the view refresh token required for this deviceId
      if (tokenRecord.deviceId !== deviceId) {
        throw new UnauthorizedException('Invalid device ID');
      }

      // Mark the refresh token as revoked (instead of deleting it)
      await this.prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { revoked: true },
      });

      // Delete cookie JWT token
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
      });

      // Delete cookie JWT token
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
      });

      return {
        message: 'Logout successfully',
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err; // Don't rethrow as InternalServerErrorException
      }

      // For other errors, we throw InternalServerErrorException
      throw new InternalServerErrorException('Logout failed');
    }
  }

  // Fuc Handler regisster User
  async registerUser(createAuthDto: CreateAuthDto) {
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
    const confirmLink = `${process.env.SERVER_URL}/api/v1/auth/email/verify?token=${emailVerificationToken}`;

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
      message: 'Create a new user successfully',
      user: removePassword(newUse),
    };
  }

  // Fuc Handler refreshToken
  async refreshToken(req: Request, res: Response, deviceId: string) {
    const isProduction = process.env.NODE_ENV === 'production';

    //get refreshToken token from client
    const cookies = req.cookies as { refresh_token?: string };
    const refreshToken = cookies.refresh_token;

    // check client side device id
    if (!deviceId) {
      throw new UnauthorizedException('Missing device ID');
    }

    // check refreshToken
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    try {
      const payload = this.tokenUtil.decodeRefreshToken(
        refreshToken,
      ) as JwtDecodedPayload;
      const { exp, iat, ...cleanPayload } = payload;

      // Check if the refresh token exists in the database
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: {
          userId_deviceId: {
            userId: payload.sub,
            deviceId,
          },
        },
      });

      //Check existence and status token
      if (!tokenRecord || tokenRecord.revoked) {
        throw new UnauthorizedException('Refresh token not found or revoked');
      }

      // Check if token is duplicate
      if (tokenRecord.token !== refreshToken) {
        throw new UnauthorizedException('Token mismatch for this device');
      }

      // Check if the refresh token has expired (using `expiresAt` from database)
      const currentTime = new Date();
      if (tokenRecord.expiresAt < currentTime) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Check if userId matches
      if (tokenRecord.userId !== payload.sub) {
        throw new UnauthorizedException('Token does not match the user');
      }

      // create a new access token
      const newAccessToken = this.tokenUtil.generateNewToken(cleanPayload);

      // Extend refresh token
      const newRefreshToken = this.tokenUtil.generateRefreshToken(cleanPayload);
      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Save the new refresh token to the database with updated expiration date
      await this.prisma.refreshToken.update({
        where: {
          userId_deviceId: {
            userId: payload.sub,
            deviceId,
          },
        },
        data: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked: false,
        },
      });

      // Set cookie
      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 15 * 60 * 1000, // 15 phút
      });

      return {
        message: 'refrefresh_token successfully',
        access_token: newAccessToken,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err; // Don't rethrow as InternalServerErrorException
      }

      // For other errors, we throw InternalServerErrorException
      throw new InternalServerErrorException(
        'Invalid or expired refresh token',
      );
    }
  }

  // Fuc resent email authentication to user not confirm email
  async resendConfirmationEmail(email: string) {
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
    const confirmLink = `${process.env.SERVER_URL}/api/v1/auth/email/verify?token=${emailVerificationToken}`;

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
      message: 'Confirmation email resent successfully',
    };
  }

  // Fuc email authentication by token sent from email
  async confirmEmailVerification(token: string) {
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
        message: 'Confirmation email resent successfully',
      };
    } catch (err) {
      console.log(err);
      throw new BadRequestException('Invalid or expired token');
    }
  }

  // forgotPassword

  // Step 1: Generate reset token and send email
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('Email not found');

    // Create a reset token with short expiry
    const payload = { sub: user.id };
    const token = this.tokenUtil.generateForgotPasswordToken(payload);

    // Send password reset link via email
    const resetLink = `${process.env.SERVER_URL}/api/v1/auth/reset-password?token=${token}`;

    //Sent email authentication to user include:
    // 1. Receiver addres
    // 2. Receiver name (can set update)
    // 3. Link confirm email
    // 4. Expiration time
    await this.emailService.sendForgotPasswordEmail(
      user.email,
      user.email,
      resetLink,
      this.tokenUtil.tokenForgotPasswordExpiresIn(),
    );

    //Return seccessfull result
    return {
      message: 'Forgot password email sent successfully',
    };
  }

  // Step 2: Validate token and reset the password
  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token and extract user ID
      const decoded = this.tokenUtil.decodeForgotPasswordToken(token);
      const userId = decoded.sub;

      // Hash new password and update user
      const hashedPassword = await hashPasswordHelper(newPassword);
      await this.usersService.updatePassword(userId, hashedPassword);

      //Return seccessfull result
      return {
        message: 'Password has been successfully reset',
      };
    } catch (e) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async accountUser(req: Request, res: Response) {
    const cookies = req.cookies as { access_token?: string };
    const access_token = cookies.access_token;

    console.log('check token', access_token);

    if (!access_token) {
      return {
        message: 'Not fount access token',
        access_token: access_token,
        user: {},
      };
    }

    const payload = this.tokenUtil.decodeAccessToken(
      access_token,
    ) as JwtDecodedPayload;

    // check user exists by id
    const existingUser = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        gender: true,
        role: true,
        isActive: true,
        avatar_url: true,
        createdAt: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found, please choose another id');
    }

    return {
      message: 'Get user detail successfully',
      access_token: access_token,
      user: existingUser,
    };
  }
}
