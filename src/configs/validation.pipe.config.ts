import { ValidationPipe, BadRequestException } from '@nestjs/common';

export const validationPipeConfig = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => {
    const formattedErrors = errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints)
          : ['No constraints provided'];
        return constraints;
      })
      .flat();

    throw new BadRequestException({
      statusCode: 400,
      message: 'Validation failed',
      errorDetail: formattedErrors,
    });
  },
});
