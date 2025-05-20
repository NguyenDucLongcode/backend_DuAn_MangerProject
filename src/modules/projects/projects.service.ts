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
import {
  deleteCloudinaryFileByMime,
  deleteImageFromCloudinary,
  uploadImageToCloudinary,
} from '@/common/utils/cloudinary.utils';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createProjet(createProjectDto: CreateProjectDto, file?: MulterFile) {
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

    // Upload ảnh nếu có
    let resultCloudinary: { secure_url: string; public_id: string } | undefined;

    if (file?.buffer) {
      resultCloudinary = await uploadImageToCloudinary(file.buffer, 'projects');
    }

    const project = await this.prisma.project.create({
      data: {
        ...createProjectDto,
        avatar_url: resultCloudinary?.secure_url,
        avatar_public_id: resultCloudinary?.public_id,
      },
    });

    //delete key
    await this.redisService.delByPattern('project:pagination:*');

    return {
      message: 'Project created successfully',
      project,
    };
  }

  async Pagination(paginationDto: PaginationProjectDto) {
    const { page, limit, name, groupId, fromDate, toDate } = paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.ProjectWhereInput = {};
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (groupId) where.groupId = { contains: groupId, mode: 'insensitive' };

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
        groupId,
        fromDate,
        toDate,
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

  async updateProject(
    id: string,
    updateProjectDto: UpdateProjectDto,
    file?: MulterFile,
  ) {
    //check exits Project
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(
        `Cannot update. Project with id ${id} not found`,
      );
    }

    // Upload ảnh nếu có
    let resultCloudinary: { secure_url: string; public_id: string } | undefined;

    if (file?.buffer) {
      const result = await uploadImageToCloudinary(file.buffer, 'projects');
      if (result) {
        // Xóa ảnh cũ sau khi có ảnh mới
        if (project.avatar_public_id) {
          await deleteImageFromCloudinary(project.avatar_public_id);
        }
        resultCloudinary = result;
      }
    }

    // Query DB
    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        avatar_url: resultCloudinary?.secure_url,
        avatar_public_id: resultCloudinary?.public_id,
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
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(
        `Cannot delete. Project with id ${id} not found`,
      );
    }

    // delete file on cloudnary
    if (project.avatar_public_id) {
      await deleteImageFromCloudinary(project.avatar_public_id);
    }

    // Query DB
    await this.prisma.project.delete({
      where: { id },
    });

    // Delete file on table file in database
    // Find files of project
    const files = await this.prisma.file.findMany({
      where: { projectId: id },
    });

    // Delete on cloudnary
    if (files.length > 0) {
      await Promise.allSettled(
        files.map(async (file) => {
          if (!file.url_public_id) return;

          try {
            const wasDeleted = await deleteCloudinaryFileByMime(
              file.url_public_id,
              file.fileType,
            );

            if (!wasDeleted) {
              console.warn(
                `Failed to delete file ${file.filename} on Cloudinary`,
              );
            }
          } catch (error) {
            console.error(`Error deleting file ${file.filename}:`, error);
          }
        }),
      );
    }

    //Query DB
    await this.prisma.file.deleteMany({ where: { projectId: id } });

    //delete key
    await this.redisService.delByPattern('project:pagination:*');
    await this.redisService.del(`project:findOne:id=${id}`);
    await this.redisService.delByPattern('files:pagination*');

    return {
      message: 'Project deleted successfully',
    };
  }
}
