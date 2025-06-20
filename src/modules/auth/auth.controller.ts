import {
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Body,
  Query,
  Res,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './type/type';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { Request, Response } from 'express';
import { Public } from '@/common/decorators/public.decorator';

import { CreateAuthDto } from './dto/create-auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { MetricsService } from '@/metrics/metrics.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private metricsService: MetricsService,
  ) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  handlerLogin(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-device-id') deviceId: string,
  ) {
    this.metricsService.incLogin(deviceId);
    return this.authService.login(req.user, res, deviceId);
  }

  @Post('logout')
  @Public()
  handlerLogout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-device-id') deviceId: string,
  ) {
    return this.authService.logout(req, res, deviceId);
  }

  @Get('register')
  @Public()
  handlerRegister(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.registerUser(createAuthDto);
  }

  @Post('refresh-token')
  @Public()
  refreshAccessToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-device-id') deviceId: string,
  ) {
    return this.authService.refreshToken(req, res, deviceId);
  }

  @Post('resend-confirmation')
  @Public()
  async resendEmail(@Body('email') email: string) {
    return await this.authService.resendConfirmationEmail(email);
  }

  @Get('email/verify')
  @Public()
  async confirmEmailVerification(@Query('token') token: string) {
    return this.authService.confirmEmailVerification(token);
  }

  @Post('reset-password')
  @Public()
  resetPassword(@Query('token') token: string, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(token, dto.newPassword);
  }

  @Post('forgot-password')
  @Public()
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Get('refresh_Account_User')
  @Public()
  async refreshAccountUser(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.accountUser(req, res);
  }
}
