// system
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { Prisma } from '@prisma/client';

// schema
import {
  ReviewPaginationCache,
  ReviewPaginationCacheSchema,
} from '@/common/schemas/review/review-pagination-cache.schema';

import {
  ReviewIDCache,
  ReviewIDCacheSchema,
} from '@/common/schemas/review/review-findOne-cache.schema';

//DTO
import { CreateReviewDto, UpdateReviewDto, PaginationReviewDto } from './dto';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createReview(createReviewDto: CreateReviewDto) {
    const { userId, projectId } = createReviewDto;
    // check exits user
    const exitsUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!exitsUser) {
      throw new NotFoundException(
        `User not found, please chose userId different`,
      );
    }

    // check exits project
    const exitsProject = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!exitsProject) {
      throw new NotFoundException(
        `Project not found, please chose projectId different`,
      );
    }

    // Check if the user has already reviewed the project
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        projectId,
      },
    });

    if (existingReview) {
      throw new ConflictException('User has already reviewed this project');
    }

    // crate review
    const review = await this.prisma.review.create({
      data: createReviewDto,
    });

    //delete key
    await this.redisService.delByPattern('reviews:pagination:*');

    return {
      message: 'Create Review successfully',
      review,
    };
  }

  async Pagination(paginationDto: PaginationReviewDto) {
    const { page, limit, userId, projectId, rating, fromDate, toDate } =
      paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.ReviewWhereInput = {};
    if (userId) where.userId = { contains: userId, mode: 'insensitive' };
    if (projectId)
      where.projectId = { contains: projectId, mode: 'insensitive' };
    if (rating) where.rating = { equals: rating };

    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    // create cache key
    const filterKey = JSON.stringify({
      page,
      limit,
      userId,
      projectId,
      rating,
      fromDate,
      toDate,
    });
    const cacheKey = `reviews:pagination:${filterKey}`;

    //  get data from key in redis
    const cachedString = await this.redisService.get(cacheKey);

    if (cachedString) {
      const cached: ReviewPaginationCache = ReviewPaginationCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return cached;
    }

    // Query DB
    const reviews = await this.prisma.review.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // totalPages
    const totalCount = await this.prisma.review.count({ where });

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      reviews,
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

  async findOne(reviewId: string) {
    //chgeck exits Review
    const exitsReview = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!exitsReview) {
      throw new NotFoundException(`Review with id ${reviewId} not found`);
    }

    // cache
    const cacheKey = `reviews:findOne:id=${reviewId}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: ReviewIDCache = ReviewIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'Review detail',
      review: exitsReview,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updateReview(reviewId: string, updateReviewDto: UpdateReviewDto) {
    const { rating, comment } = updateReviewDto;
    //chgeck exits review
    const existingReview = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new NotFoundException(
        `Cannot update. Review with id ${reviewId} not found`,
      );
    }

    // Query DB
    const updateReview = await this.prisma.review.update({
      where: { id: reviewId },
      data: updateReviewDto,
    });

    //delete key
    if (rating || comment) {
      await this.redisService.delByPattern('reviews:pagination:*');
      await this.redisService.del(`reviews:findOne:id=${reviewId}`);
    }

    return {
      message: 'Review updated successfully',
      data: updateReview,
    };
  }

  async removeReview(reviewId: string) {
    // check exits Review
    const existingReview = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new NotFoundException(
        `Cannot delete. Review with id ${reviewId} not found`,
      );
    }

    // Query DB
    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    //delete key
    await this.redisService.delByPattern('reviews:pagination:*');
    await this.redisService.del(`reviews:findOne:id=${reviewId}`);

    return {
      message: 'Review deleted successfully',
    };
  }
}
