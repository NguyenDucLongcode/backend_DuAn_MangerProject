import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { PaginationProjectDto } from './dto/pagination-project.dto';
import { Prisma } from '@prisma/client';
import {
  ProjectIDCache,
  ProjectIDCacheSchema,
} from '../../common/schemas/Project/project-findOne-cache.schema';
import {
  ProjectPaginationCache,
  ProjectPaginationCacheSchema,
} from '@/common/schemas/Project/project-pagination-cache.schema';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createProjet(createProjectDto: CreateProjectDto) {
    const { groupId, name } = createProjectDto;
    // check group dev is exits
    const exitsGroupDev = await this.prisma.groupDev.findFirst({
      where: { id: groupId },
    });

    if (!exitsGroupDev) {
      throw new NotFoundException(
        `Group dev not found, please chose groupId different`,
      );
    }

    // Check for duplicate project names within a group
    const exitsName = await this.prisma.project.findFirst({
      where: { groupId, name },
    });

    if (exitsName) {
      throw new BadRequestException(
        `Name Project already exits, please chose name different`,
      );
    }

    const project = await this.prisma.project.create({
      data: { ...createProjectDto },
    });

    //delete key
    await this.redisService.delByPattern('project:pagination:*');

    return {
      message: 'Project created successfully',
      project,
    };
  }

  async Pagination(paginationDto: PaginationProjectDto) {
    const { page, limit, name, groupId } = paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.ProjectWhereInput = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (groupId) where.groupId = { contains: groupId, mode: 'insensitive' };

    // Chỉ tạo cacheKey nếu name >= 3 ký tự hoặc không có name
    let cacheKey: string | null = null;
    const isCacheable = !name || name.length >= 3;

    if (isCacheable) {
      // create cache key
      const filterKey = JSON.stringify({
        page,
        limit,
        name,
        groupId,
      });
      cacheKey = `project:pagination:${filterKey}`;

      //  get data from key in redis
      const cachedString = await this.redisService.get(cacheKey);
      if (cachedString) {
        const cached: ProjectPaginationCache =
          ProjectPaginationCacheSchema.parse(JSON.parse(cachedString));
        return cached;
      }
    }

    // Query DB
    const groupDevs = await this.prisma.project.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // totalPages
    const totalCount = await this.prisma.project.count({ where });

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      projects: groupDevs,
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

  async findProjectById(id: string) {
    //chgeck exits Project
    const exitsProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!exitsProject) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }

    // cache
    const cacheKey = `project:findOne:id=${id}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: ProjectIDCache = ProjectIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'Project detail',
      project: exitsProject,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    const { description, groupId, name } = updateProjectDto;

    //chgeck exits Project
    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException(
        `Cannot update. Project with id ${id} not found`,
      );
    }

    // Query DB
    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
      },
    });

    //delete key
    await this.redisService.delByPattern('project:pagination:*');
    await this.redisService.del(`project:findOne:id=${id}`);

    return {
      message: 'Project updated successfully',
      data: updatedProject,
    };
  }

  async removeProjectDev(id: string) {
    // check exits Project
    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException(
        `Cannot delete. Project with id ${id} not found`,
      );
    }

    // Query DB
    await this.prisma.project.delete({
      where: { id },
    });

    //delete key
    await this.redisService.delByPattern('project:pagination:*');
    await this.redisService.del(`project:findOne:id=${id}`);

    return {
      message: 'Project deleted successfully',
    };
  }
}
