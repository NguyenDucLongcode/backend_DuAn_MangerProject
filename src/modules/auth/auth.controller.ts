import {
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Body,
  Query,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './type/type';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { Request, Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';

import { CreateAuthDto } from './dto/create-auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  handlerLogin(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(req.user, res);
  }

  @Post('logout')
  @Public()
  handlerLogout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(req, res);
  }

  @Get('register')
  @Public()
  handlerRegister(@Body() createAuthDto: CreateAuthDto, @Req() req: Request) {
    return this.authService.registerUser(createAuthDto, req);
  }

  @Post('refresh-token')
  @Public()
  refreshAccessToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshToken(req, res);
  }

  @Post('resend-confirmation')
  @Public()
  async resendEmail(@Body('email') email: string, @Req() req: Request) {
    return await this.authService.resendConfirmationEmail(email, req);
  }

  @Get('email/verify')
  @Public()
  async confirmEmailVerification(
    @Query('token') token: string,
    @Req() req: Request,
  ) {
    return this.authService.confirmEmailVerification(token, req);
  }

  @Post('reset-password')
  @Public()
  resetPassword(
    @Query('token') token: string,
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
  ) {
    return this.authService.resetPassword(token, dto.newPassword, req);
  }

  @Post('forgot-password')
  @Public()
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.authService.forgotPassword(dto.email, req);
  }
}
