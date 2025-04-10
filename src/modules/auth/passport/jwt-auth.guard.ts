import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IVerifyOptions } from 'passport-local';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: Error | null,
    user: TUser,
    info: IVerifyOptions | string | undefined,
  ): TUser {
    if (err || !user) {
      // Log chi tiết nếu cần debug
      console.warn('Auth Error:', err?.message);
      console.warn('Auth Info:', info);

      // Gán thông báo lỗi chi tiết hơn từ info
      let message = 'Không thể xác thực người dùng.';
      const infoMessage = typeof info === 'string' ? info : info?.message;

      switch (infoMessage) {
        case 'jwt expired':
          message = 'Token đã hết hạn, vui lòng đăng nhập lại.';
          break;
        case 'invalid token':
          message = 'Token không hợp lệ.';
          break;
        case 'No auth token':
          message = 'Không tìm thấy token trong header.';
          break;
      }

      throw new UnauthorizedException(message);
    }
    return user;
  }
}
