import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service'; // primas
import { $Enums, Prisma } from '@prisma/client';
import { CreateUserDto, PaginationDto, UpdateUserDto } from './dto'; // dto
// common utils
import { removePassword, hashPasswordHelper } from '@/common/utils/user.utils';

import { RedisService } from '@/redis/redis.service'; // cache

// schemas
import {
  UserPaginationCache,
  UserPaginationCacheSchema,
} from '@/common/schemas/user/user-pagination-cache.schema';
import {
  UserIDCache,
  UserIDCacheSchema,
} from '@/common/schemas/user/user-findOne-cache.schema';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Fuc create user
  async create(createUserDto: CreateUserDto) {
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
    await this.redisService.delByPattern('users:pagination:*');

    // Return seccessfull result
    return {
      message: 'Create a new user successfully',
      user: removePassword(createUser),
    };
  }

  // pagination user
  async Pagination(paginationDto: PaginationDto) {
    const { page, limit, name, email, role, isActive, fromDate, toDate } =
      paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.UserWhereInput = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (role) where.role = { equals: role as $Enums.UserRoleEnum };
    if (typeof isActive === 'boolean') where.isActive = isActive;

    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // Chỉ tạo cacheKey nếu name >= 3 ký tự hoặc không có name
    let cacheKey: string | null = null;
    const isCacheable = !name || name.length >= 3;

    if (isCacheable) {
      // create cache key
      const filterKey = JSON.stringify({
        page,
        limit,
        name,
        email,
        role,
        isActive,
        fromDate,
        toDate,
      });
      cacheKey = `users:pagination:${filterKey}`;

      // get data from key in redis
      const cachedString = await this.redisService.get(cacheKey);
      if (cachedString) {
        const cached: UserPaginationCache = UserPaginationCacheSchema.parse(
          JSON.parse(cachedString),
        );
        return cached;
      }
    }

    // Query DB
    const users = await this.prisma.user.findMany({
      skip,
      take,
      where,
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
        isActive: true,
        createdAt: true,
      },
    });

    // totalPages
    const totalCount = await this.prisma.user.count({ where });

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      users: users,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };

    // Lưu cache nếu hợp lệ
    if (cacheKey) {
      await this.redisService.set(cacheKey, result, 1800); // 30 phút
    }

    return result;
  }

  // find user by id
  async findOne(id: string) {
    // check user exists by id
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found, please choose another id');
    }

    // cache
    const cacheKey = `users:findOne:id=${id}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: UserIDCache = UserIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'Get user by id successfully',
      user: removePassword(existingUser),
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  // update user
  async update(id: string, updateUserDto: UpdateUserDto) {
    const { name, phone, address, gender, role } = updateUserDto;
    // check user exists by id
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found, please choose another id');
    }
    // Check if  phone exists in database. If so, throw an error.
    if (phone) {
      const exitisPhoneNumber = await this.prisma.user.findFirst({
        where: { phone },
      });

      if (exitisPhoneNumber) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // update information user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });

    // delete key
    if (name || phone || address || gender || role) {
      await this.redisService.delByPattern('users:pagination:*');
      await this.redisService.del(`users:findOne:id=${id}`);
    }

    // Return seccessfull result
    return {
      message: 'update user successfully',
      user: removePassword(updatedUser),
    };
  }

  async remove(id: string) {
    // check user exists
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found, please choose another id');
    }

    // delete user
    await this.prisma.user.delete({ where: { id } });

    // delete all 'users:pagination:*' keys cache
    await this.redisService.delByPattern('users:pagination:*');
    await this.redisService.del(`users:findOne:id=${id}`);

    // Return seccessfull result
    return {
      message: 'Delete user successfully',
      user: removePassword(user),
    };
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email } });
  }

  async updatePassword(id: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }
}
