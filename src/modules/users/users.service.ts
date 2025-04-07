import { Injectable } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

import { PrismaService } from '@/prisma/prisma.service'; // primas
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto'; // dto
// common utils
import { removePassword, hashPasswordHelper } from '@/common/utils/user.utils';
import { validateId } from '@/common/utils/validated.utils';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // create user
  async create(createUserDto: CreateUserDto, req: Request) {
    // Check if email or phone exists in database. If so, throw an error.
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: createUserDto.email }, { phone: createUserDto.phone }],
      },
    });

    if (existingUser) {
      const errorMessage =
        existingUser.email === createUserDto.email
          ? 'Email đã tồn tại'
          : 'Số điện thoại đã tồn tại';

      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Validation failed',
          errorDetail: errorMessage,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const hashedPassword = await hashPasswordHelper(createUserDto.password);
    const createUser = await this.prisma.user.create({
      data: {
        ...createUserDto, // Spread toàn bộ thông tin từ createUserDto
        password: hashedPassword,
      },
    });

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Create a new user successfully',
      data: removePassword(createUser),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  // pagination user
  async Pagination(paginationDto: PaginationDto, req: Request) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;
    const take = limit;

    // remove password from user
    const users = await this.prisma.user.findMany({
      skip,
      take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        gender: true,
        role: true,
        createdAt: true,
      },
    });

    // totalPages
    const totalCount = await this.prisma.user.count();

    return {
      statusCode: HttpStatus.OK,
      message: 'Get Pagination successfully',
      data: {
        dataUser: users,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  // find user by id
  async findOne(id: number, req: Request) {
    // validate id
    validateId(id, req.originalUrl);

    // check user exists by id
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Validation failed',
          errorDetail: 'User không tồn tại',
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Get user by id successfully',
      data: removePassword(existingUser),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  // update user
  async update(id: number, updateUserDto: UpdateUserDto, req: Request) {
    // validate id
    validateId(id, req.originalUrl);

    // check user exists by id
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Validation failed',
          errorDetail: 'User not found,Please choose different id',
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // update information user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'update user successfully',
      data: removePassword(updatedUser),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  async remove(id: number, req: Request) {
    // validate id
    validateId(id, req.originalUrl);

    // check user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Validation failed',
          errorDetail: 'User not found,Please choose different id',
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // delete user
    await this.prisma.user.delete({ where: { id } });

    return {
      statusCode: HttpStatus.OK,
      message: 'Delete user successfully',
      data: null,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email } });
  }
}
