import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { PaginationOrderDto } from './dto/pagination-order.dto';
import { Prisma } from '@prisma/client';

// schema
import {
  OrderIDCache,
  OrderIDCacheSchema,
} from '@/common/schemas/order_payment/order-findOne-cache.schema';
import {
  OrderPaginationCache,
  OrderPaginationCacheSchema,
} from '@/common/schemas/order_payment/order-pagination-cache.schema';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createOrder(createOrderDto: CreateOrderDto) {
    // check user exists in DB
    const existsUser = await this.prisma.user.findUnique({
      where: { id: createOrderDto.userId },
    });

    if (!existsUser) {
      throw new NotFoundException(
        `User not found, please chose userId different`,
      );
    }

    // create in DB
    const order = await this.prisma.order.create({
      data: createOrderDto,
    });

    //delete key
    await this.redisService.delByPattern('order:pagination:*');

    return {
      message: 'Create order successfully',
      order,
    };
  }

  async Pagination(paginationDto: PaginationOrderDto) {
    const {
      page,
      limit,
      userId,
      minAmount,
      maxAmount,
      paymentStatus,
      fromDate,
      toDate,
    } = paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.OrderWhereInput = {};

    if (userId) {
      where.userId = { contains: userId, mode: 'insensitive' };
    }

    if (fromDate || toDate) {
      where.createdAt = {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      };
    }

    if (
      (minAmount !== undefined && minAmount !== 0) ||
      (maxAmount !== undefined && maxAmount !== 0)
    ) {
      where.totalAmount = {
        ...(minAmount !== undefined && minAmount !== 0 && { gte: minAmount }),
        ...(maxAmount !== undefined && maxAmount !== 0 && { lte: maxAmount }),
      };
    }

    if (paymentStatus) {
      where.payment = {
        status: paymentStatus,
      };
    }

    // create cache key
    const filterKey = JSON.stringify({
      page,
      limit,
      userId,
      minAmount,
      maxAmount,
      paymentStatus,
      fromDate,
      toDate,
    });
    const cacheKey = `order:pagination:${filterKey}`;

    //  get data from key in redis
    const cachedString = await this.redisService.get(cacheKey);

    if (cachedString) {
      const cached: OrderPaginationCache = OrderPaginationCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return cached;
    }

    // Query DB
    const orders = await this.prisma.order.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // totalPages
    const totalCount = await this.prisma.order.count({ where });

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      orders,
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

  async findOrderById(id: string) {
    //check exits order
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundException(
        `Cannot update. Order with id ${id} not found`,
      );
    }

    // cache
    const cacheKey = `order:findOne:id=${id}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: OrderIDCache = OrderIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'Order detail',
      order: existingOrder,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto) {
    //check exits order
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundException(
        `Cannot update. Order with id ${id} not found`,
      );
    }

    // Query DB
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
    });

    //delete key
    await this.redisService.delByPattern('order:pagination:*');
    await this.redisService.del(`order:findOne:id=${id}`);

    return {
      message: 'Order updated successfully',
      data: updatedOrder,
    };
  }

  async removeOrder(id: string) {
    //check exits order
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundException(
        `Cannot update. Order with id ${id} not found`,
      );
    }

    // Query DB
    await this.prisma.order.delete({
      where: { id },
    });

    //delete key
    await this.redisService.delByPattern('order:pagination:*');
    await this.redisService.del(`order:findOne:id=${id}`);

    return {
      message: 'Order deleted successfully',
    };
  }
}
