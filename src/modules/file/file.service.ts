import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import {
  deleteCloudinaryFileByMime,
  uploadImageToCloudinary,
} from '@/common/utils/cloudinary.utils';

//DTO
import { PaginationDto } from './dto/pagination-file.dto';
import { CreateFileDto } from './dto/create-file.dto';
import { Prisma } from '@prisma/client';
import {
  FilePaginationCache,
  FilePaginationCacheSchema,
} from '@/common/schemas/file/file-pagination-cache.schema';
import { MulterFile } from '@/types/multer-file';

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(createFileDto: CreateFileDto, files: MulterFile[]) {
    // Check exist project
    const project = await this.prisma.project.findUnique({
      where: { id: createFileDto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const results = await Promise.allSettled(
      files.map(async (file) => {
        try {
          // Check file buffer
          if (!file?.buffer) {
            throw new Error('Invalid file buffer');
          }

          // Upload file to Cloudinary
          const resultCloudinary = await uploadImageToCloudinary(
            file.buffer,
            'files',
          );

          if (!resultCloudinary?.secure_url) {
            throw new Error('Failed to upload file to Cloudinary');
          }

          // Create file in database
          const created = await this.prisma.file.create({
            data: {
              ...createFileDto,
              filename: file.originalname,
              fileType: file.mimetype,
              size: file.size.toString(),
              url: resultCloudinary.secure_url,
              url_public_id: resultCloudinary.public_id,
            },
          });

          return created;
        } catch (error) {
          // Log the error and rethrow
          console.error(`Failed to process file ${file.originalname}:`, error);
          return null;
        }
      }),
    );

    const successfulFiles = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    if (successfulFiles.length === 0) {
      throw new InternalServerErrorException('All file uploads failed');
    }

    // delete  keys cache
    await this.redisService.delByPattern('files:pagination*');

    // Return successful result
    return {
      message: `Uploaded ${successfulFiles.length} file(s) successfully`,
      files: successfulFiles,
    };
  }

  async findByProject(paginationDto: PaginationDto) {
    const { projectId, limit, page, fileType, filename, fromDate, toDate } =
      paginationDto;
    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.FileWhereInput = {};
    if (projectId)
      where.projectId = { contains: projectId, mode: 'insensitive' };
    if (fileType) where.fileType = { contains: fileType, mode: 'insensitive' };
    if (filename) where.filename = { contains: filename, mode: 'insensitive' };

    if (fromDate || toDate) {
      where.uploadedAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // Chỉ tạo cacheKey nếu name >= 3 ký tự hoặc không có name
    let cacheKey: string | null = null;
    const isCacheable = !filename || filename.length >= 3;

    if (isCacheable) {
      // create cache key
      const filterKey = JSON.stringify({
        page,
        limit,
        projectId,
        fileType,
        filename,
        fromDate,
        toDate,
      });
      cacheKey = `files:pagination:${filterKey}`;

      // get data from key in redis
      const cachedString = await this.redisService.get(cacheKey);
      if (cachedString) {
        const cached: FilePaginationCache = FilePaginationCacheSchema.parse(
          JSON.parse(cachedString),
        );
        return cached;
      }
    }

    // Check exist project
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Query
    const [files, totalCount] = await this.prisma.$transaction([
      this.prisma.file.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          projectId: true,
          filename: true,
          fileType: true,
          size: true,
          url: true,
          uploadedAt: true,
        },
      }),
      this.prisma.file.count({ where }),
    ]);

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      files,
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

  async deleteById(id: string) {
    // Check exits file in database
    const file = await this.prisma.file.findUnique({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    // Delete on Cloudinary
    if (file.url_public_id) {
      await deleteCloudinaryFileByMime(file.url_public_id, file.fileType);
    }

    // Query DB
    const deleteFile = await this.prisma.file.delete({
      where: { id },
      select: {
        id: true,
        projectId: true,
        filename: true,
        fileType: true,
        size: true,
        url: true,
        uploadedAt: true,
      },
    }); // Xoá trong DB

    // delete  keys cache
    await this.redisService.delByPattern('files:pagination*');

    return { message: 'File deleted successfully', file: deleteFile };
  }

  async deleteFilesByProjectId(projectId: string) {
    // Check exits project in database
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Find files of project
    const files = await this.prisma.file.findMany({
      where: { projectId },
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
    await this.prisma.file.deleteMany({ where: { projectId } });

    // delete  keys cache
    await this.redisService.delByPattern('files:pagination*');

    return {
      message: `${files.length} files deleted`,
    };
  }
}
