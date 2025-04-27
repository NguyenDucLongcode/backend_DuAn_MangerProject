import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { validationPipeConfig } from './configs/validation.pipe.config'; // config ValidationPipe data request
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // add prefix minus "\"
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'], // Home page without prefix
  });

  app.useGlobalPipes(validationPipeConfig); // config ValidationPipe data request

  // config CORS
  app.enableCors({
    origin: process.env.CLIENT_URL, // Frontend URL
    credentials: true, // send attached cookies
  });

  app.use(cookieParser()); // config cookie

  // config halmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"], // chỉ cho phép chính domain này
          scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'], // cho phép script từ CDN
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            'https://fonts.googleapis.com',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'https://your-api-domain.com'], // nếu gọi API khác
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // để tránh lỗi nếu bạn không cần cross-origin isolation
    }),
  );

  const port = process.env.PORT || 8080;

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Server started at http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
