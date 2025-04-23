import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { validationPipeConfig } from './configs/validation.pipe.config'; // config ValidationPipe data request
import { PrismaExceptionFilter } from '@/prisma/prisma-exception/prisma-exception.filter'; // add global Primas exception
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });

  app.useGlobalFilters(new PrismaExceptionFilter()); //global Primas exception

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

  const port = process.env.PORT || 8080;

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Server started at http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
