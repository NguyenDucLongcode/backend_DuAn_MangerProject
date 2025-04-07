import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    // Khởi tạo lại filter và các mock object trước mỗi test
    filter = new PrismaExceptionFilter();

    // Mô phỏng response từ Express
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mô phỏng ArgumentsHost từ NestJS
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle P2002 error (duplicate)', () => {
    // Mô phỏng lỗi Prisma: dữ liệu trùng (Unique constraint)
    const error = {
      code: 'P2002',
      message: 'Unique constraint failed',
    } as Prisma.PrismaClientKnownRequestError;

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'Dữ liệu đã tồn tại',
    });
  });

  it('should handle P2025 error (not found)', () => {
    // Mô phỏng lỗi Prisma: không tìm thấy dữ liệu
    const error = {
      code: 'P2025',
      message: 'Record not found',
    } as Prisma.PrismaClientKnownRequestError;

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Dữ liệu không tồn tại',
    });
  });

  it('should handle HttpException', () => {
    // Mô phỏng lỗi HTTP thông thường (ví dụ: thiếu quyền)
    const error = new HttpException('Không được phép', HttpStatus.FORBIDDEN);

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Không được phép',
    });
  });

  it('should handle unknown errors', () => {
    // Mô phỏng lỗi không xác định (Error thông thường)
    const error = new Error('Lỗi không xác định');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Lỗi máy chủ nội bộ',
    });
  });
});
