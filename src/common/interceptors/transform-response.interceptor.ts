import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();

    // Định nghĩa HybridRequest để xử lý cả Express và Fastify
    type HybridRequest = {
      url?: string;
      raw?: { url?: string }; // Fastify sẽ có trường raw với url
    };

    const request = ctx.getRequest<HybridRequest>(); // Ép kiểu cho request
    const path = request?.url || request?.raw?.url || ''; // Lấy url từ Express hoặc Fastify

    return next.handle().pipe(
      map((data: unknown) => ({
        statusCode: 200,
        data,
        timestamp: new Date().toISOString(),
        path, // Dữ liệu path đã được lấy từ request
      })),
    );
  }
}
