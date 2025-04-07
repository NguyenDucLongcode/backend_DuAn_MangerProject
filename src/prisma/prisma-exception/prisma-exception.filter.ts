import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Lỗi hệ thống';
    let errorDetail: string | null = null;

    // Xử lý HttpException (ví dụ: từ ValidationPipe)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const safeRes = res as {
          message?: string | string[];
          errorDetail?: string | null;
        };

        if (Array.isArray(safeRes.message)) {
          message = safeRes.message.join('\n'); // giữ \n nếu có nhiều dòng lỗi
        } else if (typeof safeRes.message === 'string') {
          message = safeRes.message;
        }

        if (safeRes.errorDetail) {
          errorDetail = safeRes.errorDetail;
        }
      }
    }

    // Xử lý Prisma - lỗi đã biết (known errors)
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Dữ liệu đã tồn tại';
          errorDetail = Array.isArray(exception.meta?.target)
            ? `Trường bị trùng: ${exception.meta.target.join(', ')}`
            : 'Trường bị trùng (không rõ trường)';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Dữ liệu không tồn tại';
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          message = 'Lỗi ràng buộc dữ liệu';
          break;
        default:
          message = exception.message;
      }
    }

    // Prisma - lỗi không xác định
    else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Lỗi không xác định từ Prisma';
    }

    // Prisma - lỗi validation khi gọi Prisma
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Dữ liệu gửi lên không hợp lệ';
    }

    // Lỗi khác chưa được bắt
    else {
      console.error('Unhandled exception:', exception);
    }

    // Trả về response chuẩn
    response.status(status).json({
      statusCode: status,
      message,
      errorDetail,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
