import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let message: string | string[] = 'Internal server error';

    if (typeof rawResponse === 'object' && rawResponse !== null) {
      const res = rawResponse as Record<string, unknown>;
      if (typeof res.message === 'string' || Array.isArray(res.message)) {
        message = res.message;
      }
    } else if (typeof rawResponse === 'string') {
      message = rawResponse;
    }

    const responseBody = {
      statusCode: httpStatus,
      message,
      timestamp: new Date().toISOString(),
      // NestJS default adapter access – safe in this context
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    this.logger.error(`[${httpStatus}] ${JSON.stringify(message)}`);

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
