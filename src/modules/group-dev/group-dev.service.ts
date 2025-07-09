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
import {
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from '@/common/utils/cloudinary.utils';
import { MulterFile } from '@/types/multer-file';

@Injectable()
export class GroupDevService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createGroupDev(
    createGroupDevDto: CreateGroupDevDto,
    file?: MulterFile,
  ) {
    // Check name group exists in database
    const existsNameGroup = await this.prisma.groupDev.findFirst({
      where: {
        name: createGroupDevDto.name,
      },
    });
    if (existsNameGroup) throw new ConflictException('Name already exists');

    // Upload ảnh nếu có
    let resultCloudinary: { secure_url: string; public_id: string } | undefined;

    if (file?.buffer) {
      resultCloudinary = await uploadImageToCloudinary(file.buffer, 'groups');
    }

    // Query DB
    const groupDev = await this.prisma.groupDev.create({
      data: {
        ...createGroupDevDto,
        avatar_url: resultCloudinary?.secure_url,
        avatar_public_id: resultCloudinary?.public_id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        maxMembers: true,
        avatar_url: true,
        createdAt: true,
      },
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
    const { page, limit, name, visibility, maxMembers, fromDate, toDate } =
      paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.GroupDevWhereInput = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (maxMembers) where.maxMembers = { equals: maxMembers };
    if (visibility) where.visibility = { equals: visibility };

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
        maxMembers,
        visibility,
        fromDate,
        toDate,
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
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        maxMembers: true,
        avatar_url: true,
        createdAt: true,
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
    const currentMembers = await this.prisma.groupMember.count({
      where: { groupId: id },
    });

    const leaderInGroup = await this.prisma.groupLeader.findFirst({
      where: { groupId: id },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            gender: true,
            role: true,
            avatar_url: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    const existingGroupDev = await this.prisma.groupDev.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        maxMembers: true,
        avatar_url: true,
        createdAt: true,
      },
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
      groupDev: {
        ...existingGroupDev,
        currentMembers,
        leader: leaderInGroup?.user ?? null,
      },
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updateGroupDev(
    id: string,
    updateGroupDevDto: UpdateGroupDevDto,
    file?: MulterFile,
  ) {
    const { name, description, visibility, maxMembers } = updateGroupDevDto;
    // check group Dev exists by id
    const groupDev = await this.prisma.groupDev.findUnique({ where: { id } });
    if (!groupDev) {
      throw new NotFoundException(
        'Group Dev not found, please choose another id',
      );
    }

    // Upload ảnh nếu có
    let resultCloudinary: { secure_url: string; public_id: string } | undefined;

    if (file?.buffer) {
      const result = await uploadImageToCloudinary(file.buffer, 'groups');
      if (result) {
        // Xóa ảnh cũ sau khi có ảnh mới
        if (groupDev.avatar_public_id) {
          await deleteImageFromCloudinary(groupDev.avatar_public_id);
        }
        resultCloudinary = result;
      }
    }

    // update information group dev
    const updatedGroupDev = await this.prisma.groupDev.update({
      where: { id },
      data: {
        ...updateGroupDevDto,
        avatar_url: resultCloudinary?.secure_url,
        avatar_public_id: resultCloudinary?.public_id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        maxMembers: true,
        avatar_url: true,
        createdAt: true,
      },
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

    // delete file on cloudnary
    if (groupDev.avatar_public_id) {
      await deleteImageFromCloudinary(groupDev.avatar_public_id);
    }

    // delete group Dev
    await this.prisma.groupDev.delete({ where: { id } });

    // delete all keys cache
    await this.redisService.delByPattern('groupDev:pagination:*');
    await this.redisService.del(`groupDev:findOne:id=${id}`);

    // Return seccessfull result
    return {
      message: 'Delete group dev successfully',
    };
  }

  async isUserInGroup(groupId: string, userId: string): Promise<boolean> {
    const existingGroupDev = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    return !!existingGroupDev; // true nếu là thành viên
  }

  async isLeaderInGroup(groupId: string, userId: string) {
    // check group dev exists by id
    const existingGroupDev = await this.prisma.groupLeader.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    return !!existingGroupDev; // true nếu là leader
  }

  async FindProjectByGroupId(groupId: string) {
    const projects = await this.prisma.project.findMany({
      where: { groupId },
      select: {
        id: true,
        groupId: true,
        name: true,
        avatar_url: true,
        description: true,
        createdAt: true,
      },
    });

    return {
      message: 'Get projects by groupId success',
      projects: projects,
      countProject: projects.length,
    };
  }
}
