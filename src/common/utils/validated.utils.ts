import { HttpException, HttpStatus } from '@nestjs/common';
export function validateId(id: number, path: string) {
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpException(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errorDetail: 'ID phải là số nguyên dương',
        timestamp: new Date().toISOString(),
        path,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
