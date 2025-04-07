import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from '@/services/logger.service'; // logger winston
import { validationPipeConfig } from './configs/validation.pipe.config'; // config ValidationPipe data request
import { PrismaExceptionFilter } from '@/prisma/prisma-exception/prisma-exception.filter'; // add global Primas exception

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new PrismaExceptionFilter()); //global Primas exception

  // add prefix minus "\"
  app.setGlobalPrefix('api/v1', {
    exclude: ['/'], // Home page without prefix
  });

  app.useGlobalPipes(validationPipeConfig); // config ValidationPipe data request

  app.enableCors(); // config CORS

  const port = process.env.PORT || 3000;

  // config logger winston
  const logger = app.get(LoggerService);
  logger.log(`Server is running on http://localhost:${port}`); // write log when server starts up

  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
