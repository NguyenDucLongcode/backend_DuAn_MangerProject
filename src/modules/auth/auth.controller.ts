import {
  Controller,
  Post,
  Req,
  UseGuards,
  Get,
  Body,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from './type/type';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { Request } from 'express';
import { Public } from '@/common/decorators/public.decorator';

import { CreateAuthDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Public()
  @UseGuards(LocalAuthGuard)
  handlerLogin(@Req() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  @Get('register')
  @Public()
  handlerRegister(@Body() createAuthDto: CreateAuthDto, @Req() req: Request) {
    return this.authService.registerUser(createAuthDto, req);
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
}
