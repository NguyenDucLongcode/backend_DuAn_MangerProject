import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { PaginationTaskDto } from './dto/pagination-task.dto';
import { Prisma } from '@prisma/client';
import {
  TaskPaginationCache,
  TaskPaginationCacheSchema,
} from '@/common/schemas/tasks/tasks-pagination-cache.schema';
import {
  TaskIDCache,
  TaskIDCacheSchema,
} from '@/common/schemas/tasks/tasks-findOne-cache.schema';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createTask(createTaskDto: CreateTaskDto) {
    const { projectId, description, title, assignedTo, status, dueDate } =
      createTaskDto;

    // check project exists in DB
    const existsProject = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!existsProject) {
      throw new NotFoundException(
        `Project not found, please chose projectId different`,
      );
    }

    //check if userId is coder
    const isCoder = await this.prisma.user.findUnique({
      where: { id: assignedTo, role: 'CODER' },
    });

    if (!isCoder) {
      throw new ConflictException(
        'User is not a developer, please choose another userId',
      );
    }

    // dueDate must be greater than current time
    if (dueDate && new Date(dueDate) < new Date()) {
      throw new BadRequestException('Due date must be in the future');
    }

    // crate task
    const task = await this.prisma.task.create({
      data: {
        projectId,
        description,
        title,
        assignedTo,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });

    //delete key
    await this.redisService.delByPattern('task:pagination:*');

    return task;
  }

  async Pagination(paginationDto: PaginationTaskDto) {
    const { page, limit, assignedTo, projectId, status } = paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.TaskWhereInput = {};
    if (assignedTo)
      where.assignedTo = { contains: assignedTo, mode: 'insensitive' };
    if (projectId)
      where.projectId = { contains: projectId, mode: 'insensitive' };
    if (status) where.status = { equals: status };

    // create cache key
    const filterKey = JSON.stringify({
      page,
      limit,
      assignedTo,
      projectId,
      status,
    });
    const cacheKey = `task:pagination:${filterKey}`;

    //  get data from key in redis
    const cachedString = await this.redisService.get(cacheKey);

    if (cachedString) {
      const cached: TaskPaginationCache = TaskPaginationCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return cached;
    }

    // Query DB
    const tasks = await this.prisma.task.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // totalPages
    const totalCount = await this.prisma.task.count({ where });

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      tasks,
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

  async findTaskById(id: string) {
    // check exits task
    const exitsTask = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!exitsTask) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }

    // cache
    const cacheKey = `task:findOne:id=${id}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: TaskIDCache = TaskIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'Task detail',
      task: exitsTask,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updateTask(id: string, updateTaskDto: UpdateTaskDto) {
    const { projectId, assignedTo, title, description, status, dueDate } =
      updateTaskDto;

    //check exits task
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new NotFoundException(
        `Cannot update. Task with id ${id} not found`,
      );
    }

    // dueDate must be greater than current time
    if (dueDate && new Date(dueDate) < new Date()) {
      throw new BadRequestException('Due date must be in the future');
    }

    // Query DB
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        ...updateTaskDto,
        dueDate: dueDate ? new Date(dueDate) : '',
      },
    });

    //delete key
    if (projectId || assignedTo || title || description || dueDate || status) {
      await this.redisService.delByPattern('task:pagination:*');
      await this.redisService.del(`task:findOne:id=${id}`);
    }

    return {
      message: 'Task updated successfully',
      data: updatedTask,
    };
  }

  async removeTask(id: string) {
    // check exits task
    const existingTask = await this.prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      throw new NotFoundException(
        `Cannot delete. task with id ${id} not found`,
      );
    }

    // Query DB
    await this.prisma.task.delete({
      where: { id },
    });

    //delete key
    await this.redisService.delByPattern('task:pagination:*');
    await this.redisService.del(`task:findOne:id=${id}`);

    return {
      message: 'Project deleted successfully',
    };
  }
}
