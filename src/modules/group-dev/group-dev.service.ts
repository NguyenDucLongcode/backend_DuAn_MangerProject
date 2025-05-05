// Service
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';

// DOT

import {
  CreateGroupDevDto,
  UpdateGroupDevDto,
  PaginationGroupDevDto,
} from './dto';
import { Prisma } from '@prisma/client';
import {
  GroupDevPaginationCache,
  GroupDevPaginationCacheSchema,
} from '@/common/schemas/groupDev/groupDev-pagination-cache.schema';
import {
  GroupDevIDCache,
  GroupDevIDCacheSchema,
} from '@/common/schemas/groupDev/groupDev-findOne-cache.schema';

@Injectable()
export class GroupDevService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createGroupDev(createGroupDevDto: CreateGroupDevDto) {
    // Check name group exists in database
    const existsNameGroup = await this.prisma.groupDev.findFirst({
      where: {
        name: createGroupDevDto.name,
      },
    });
    if (existsNameGroup) throw new ConflictException('Name already exists');

    // Query DB
    const groupDev = await this.prisma.groupDev.create({
      data: { ...createGroupDevDto },
    });

    //delete key
    await this.redisService.delByPattern('groupDev:pagination:*');

    // Return seccessfull result
    return {
      message: 'Create a new GroupDev successfully',
      dataGroup: groupDev,
    };
  }

  async Pagination(paginationDto: PaginationGroupDevDto) {
    const { page, limit, name, visibility, maxMembers } = paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.GroupDevWhereInput = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (maxMembers) where.maxMembers = { equals: maxMembers };
    if (visibility) where.visibility = { equals: visibility };

    // Chỉ tạo cacheKey nếu name >= 3 ký tự hoặc không có name
    let cacheKey: string | null = null;
    const isCacheable = !name || name.length >= 3;

    if (isCacheable) {
      // create cache key
      const filterKey = JSON.stringify({
        page,
        limit,
        name,
        maxMembers,
        visibility,
      });
      cacheKey = `groupDev:pagination:${filterKey}`;

      // // get data from key in redis
      const cachedString = await this.redisService.get(cacheKey);
      if (cachedString) {
        const cached: GroupDevPaginationCache =
          GroupDevPaginationCacheSchema.parse(JSON.parse(cachedString));
        return cached;
      }
    }

    // Query DB
    const groupDevs = await this.prisma.groupDev.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // totalPages
    const totalCount = await this.prisma.groupDev.count({ where });

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      groupDevs: groupDevs,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };

    // // Lưu cache nếu hợp lệ
    if (cacheKey) {
      await this.redisService.set(cacheKey, result, 1800); // 30 phút
    }

    return result;
  }

  async findOne(id: string) {
    // check group dev exists by id
    const existingGroupDev = await this.prisma.groupDev.findUnique({
      where: { id },
    });

    if (!existingGroupDev) {
      throw new NotFoundException(
        'Group dev not found, please choose another id',
      );
    }

    // cache
    const cacheKey = `groupDev:findOne:id=${id}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: GroupDevIDCache = GroupDevIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'Get group dev by id successfully',
      groupDev: existingGroupDev,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updateGroupDev(id: string, updateGroupDevDto: UpdateGroupDevDto) {
    const { name, description, visibility, maxMembers } = updateGroupDevDto;
    // check group Dev exists by id
    const groupDev = await this.prisma.groupDev.findUnique({ where: { id } });
    if (!groupDev) {
      throw new NotFoundException(
        'Group Dev not found, please choose another id',
      );
    }

    // update information group dev
    const updatedGroupDev = await this.prisma.groupDev.update({
      where: { id },
      data: updateGroupDevDto,
    });

    // delete all  keys cache
    if (name || description || visibility || maxMembers) {
      await this.redisService.delByPattern('groupDev:pagination:*');
      await this.redisService.del(`groupDev:findOne:id=${id}`);
    }

    // Return seccessfull result
    return {
      message: 'update group dev successfully',
      groupDev: updatedGroupDev,
    };
  }

  async removeGroupDev(id: string) {
    // check group Dev exists
    const groupDev = await this.prisma.groupDev.findUnique({ where: { id } });
    if (!groupDev) {
      throw new NotFoundException(
        'Group dev not found, please choose another id',
      );
    }

    // delete group Dev
    await this.prisma.groupDev.delete({ where: { id } });

    // delete all keys cache
    await this.redisService.delByPattern('groupDev:pagination:*');
    await this.redisService.del(`groupDev:findOne:id=${id}`);

    // Return seccessfull result
    return {
      message: 'Delete group dev successfully',
      groupDev,
    };
  }
}
