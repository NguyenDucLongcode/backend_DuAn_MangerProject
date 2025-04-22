import {
  Injectable,
  HttpStatus,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';

import { PrismaService } from '@/prisma/prisma.service'; // primas
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto'; // dto
// common utils
import { removePassword, hashPasswordHelper } from '@/common/utils/user.utils';

import { RedisService } from '@/redis/redis.service'; // cache

// schemas
import {
  UserPaginationCache,
  UserPaginationCacheSchema,
} from '@/common/schemas/user-pagination-cache.schema';

@Injectable()
export class UsersService {
  constructor(
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Fuc create user
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
          ? 'Email already exists'
          : 'Phone number already exists';

      throw new ConflictException(errorMessage);
    }

    // hash passworld
    const hashedPassword = await hashPasswordHelper(createUserDto.password);

    // Create new a user in DB
    const createUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        isActive: true,
      },
    });

    //delete key
    await this.redisService.delByPattern('users:pagination:page=1&limit=*');

    // Return seccessfull result
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

    const cacheKey = `users:pagination:page=${page}&limit=${limit}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: UserPaginationCache = UserPaginationCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
        cache: true,
      };
    }

    // remove password from user
    const users = await this.prisma.user.findMany({
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
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

    // Return seccessfull result
    const result = {
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

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  // find user by id
  async findOne(id: string, req: Request) {
    // check user exists by id
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found, please choose another id');
    }

    // Return seccessfull result
    return {
      statusCode: HttpStatus.OK,
      message: 'Get user by id successfully',
      data: removePassword(existingUser),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  // update user
  async update(id: string, updateUserDto: UpdateUserDto, req: Request) {
    // check user exists by id
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found, please choose another id');
    }

    // update information user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // delete all 'users:pagination:*' keys cache
    await this.redisService.delByPattern('users:pagination:*');

    // Return seccessfull result
    return {
      statusCode: HttpStatus.OK,
      message: 'update user successfully',
      data: removePassword(updatedUser),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  async remove(id: string, req: Request) {
    // check user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found, please choose another id');
    }

    // delete user
    await this.prisma.user.delete({ where: { id } });

    // delete all 'users:pagination:*' keys cache
    await this.redisService.delByPattern('users:pagination:*');

    // Return seccessfull result
    return {
      statusCode: HttpStatus.OK,
      message: 'Delete user successfully',
      data: removePassword(user),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email } });
  }
}
