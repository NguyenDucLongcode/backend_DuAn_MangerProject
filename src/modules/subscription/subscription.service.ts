import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { Prisma } from '@prisma/client';

// dto
import {
  PaginationSubscriptionDto,
  UpdateSubscriptionDto,
  CreateSubscriptionDto,
} from './dto';

// schemas
import {
  SubscriptionPaginationCache,
  SubscriptionPaginationCacheSchema,
} from '@/common/schemas/subscription/subscription-pagination-cache.schema';
import {
  SubscriptionIDCache,
  SubscriptionIDCacheSchema,
} from '@/common/schemas/subscription/subscription-findOne-cache.schema';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const { userId, expiresAt, plan, price } = createSubscriptionDto;
    // check exits user
    const exitsUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!exitsUser) {
      throw new NotFoundException(
        `User not found, please chose userId different`,
      );
    }

    // check exits subscription
    const exitsSubscription = await this.prisma.subscription.findFirst({
      where: { userId },
    });

    if (exitsSubscription) {
      throw new ConflictException(
        `User has already subscribed, please choose another userId`,
      );
    }

    // expiresAt  must be greater than current time
    if (expiresAt && new Date(expiresAt) < new Date()) {
      throw new BadRequestException('expiresAt  must be in the future');
    }

    // crate Subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        userId,
        plan: plan || 'FREE',
        price,
        expiresAt: new Date(expiresAt),
      },
    });

    //delete key
    await this.redisService.delByPattern('subscriptions:pagination:*');

    return {
      message: 'Subscription successfully',
      subscription,
    };
  }

  async Pagination(paginationDto: PaginationSubscriptionDto) {
    const { page, limit, userId, plan } = paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.SubscriptionWhereInput = {};
    if (userId) where.userId = { contains: userId, mode: 'insensitive' };
    if (plan) where.plan = { equals: plan };

    // create cache key
    const filterKey = JSON.stringify({
      page,
      limit,
      userId,
      plan,
    });
    const cacheKey = `subscriptions:pagination:${filterKey}`;

    //  get data from key in redis
    const cachedString = await this.redisService.get(cacheKey);

    if (cachedString) {
      const cached: SubscriptionPaginationCache =
        SubscriptionPaginationCacheSchema.parse(JSON.parse(cachedString));
      return cached;
    }

    // Query DB
    const subscriptions = await this.prisma.subscription.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // totalPages
    const totalCount = await this.prisma.subscription.count({ where });

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      subscriptions,
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

  async findOne(id: string) {
    //chgeck exits Subscription
    const exitsSubscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!exitsSubscription) {
      throw new NotFoundException(`Subscription with id ${id} not found`);
    }

    // cache
    const cacheKey = `subscriptions:findOne:id=${id}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: SubscriptionIDCache = SubscriptionIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'Subscription detail',
      project: exitsSubscription,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updateSubscription(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    const { plan, expiresAt, price } = updateSubscriptionDto;

    // validate price
    if (price && price <= 0) {
      throw new BadRequestException('Price phải lớn hơn hoặc bằng 1');
    }

    // expiresAt  must be greater than current time
    if (expiresAt && new Date(expiresAt) < new Date()) {
      throw new BadRequestException('expiresAt  must be in the future');
    }

    //chgeck exits Subscription
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      throw new NotFoundException(
        `Cannot update. Subscription with id ${id} not found`,
      );
    }

    // Query DB
    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        plan,
        expiresAt: expiresAt ? new Date(expiresAt) : '',
        price,
      },
    });

    //delete key
    await this.redisService.delByPattern('subscriptions:pagination:*');
    await this.redisService.del(`subscriptions:findOne:id=${id}`);

    return {
      message: 'Subscription updated successfully',
      data: updatedSubscription,
    };
  }

  async removeSubscription(id: string) {
    // check exits Subscription
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      throw new NotFoundException(
        `Cannot delete. Subscription with id ${id} not found`,
      );
    }

    // Query DB
    await this.prisma.subscription.delete({
      where: { id },
    });

    //delete key
    await this.redisService.delByPattern('subscriptions:pagination:*');
    await this.redisService.del(`subscriptions:findOne:id=${id}`);

    return {
      message: 'Subscription deleted successfully',
    };
  }
}
