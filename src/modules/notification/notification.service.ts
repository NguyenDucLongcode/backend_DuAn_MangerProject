// system
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RedisService } from '@/redis/redis.service';

//schema
import {
  NotificationIDCache,
  NotificationIDCacheSchema,
} from '@/common/schemas/notification/notification-findOne-cache.schema';

import {
  NotificationPaginationCache,
  NotificationPaginationCacheSchema,
} from '@/common/schemas/notification/notification-pagination-cache.schema';

//DTO
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  PaginationNotificationDto,
} from './dto';
import { Server } from 'socket.io';
@Injectable()
export class NotificationService {
  private server!: Server;
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Đặt server cho socket
  setServer(server: Server) {
    this.server = server;
  }

  // Đăng ký socket cho user
  async registerSocket(userId: string, socketId: string) {
    await this.redisService.sadd(`socket:user:${userId}`, socketId);
  }

  // Xóa socket khi user ngắt kết nối
  async removeSocket(socketId: string) {
    // 1. Lấy tất cả các key Redis có dạng "socket:user:*" (gồm cả notification, chat, v.v.)
    const userKeys = await this.redisService.scanKeys('socket:user:*');

    // 2. Duyệt qua từng key để tìm socketId cần xóa
    for (const key of userKeys) {
      // 3. Thử xóa socketId khỏi Set của key hiện tại
      const removed = await this.redisService.srem(key, socketId);

      //  4. Nếu socketId đã được xóa khỏi Set
      if (removed > 0) {
        //  5. Lấy danh sách socketId còn lại trong Set
        const members = await this.redisService.smembers(key);

        //  6. Nếu không còn socketId nào → xóa luôn key đó khỏi Redis
        if (members.length === 0) {
          await this.redisService.del(key);
        }

        // 7. Thoát vòng lặp vì socketId chỉ nằm trong một key
        break;
      }
    }
  }

  // Gửi thông báo cho user qua socket
  async sendNotification(userId: string, payload: any) {
    const socketIds = await this.redisService.smembers(`socket:user:${userId}`);

    if (!this.server || !socketIds || socketIds.length === 0) return;

    for (const socketId of socketIds) {
      this.server.to(socketId).emit('notify', payload);
    }
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // Gọi ở gateway để truyền server instance
  bindServer(server: Server) {
    this.server = server;
  }

  // API: Tạo thông báo
  async createNotification(createNotificationDto: CreateNotificationDto) {
    const { userId } = createNotificationDto;
    // check exits user
    const exitsUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!exitsUser) {
      throw new NotFoundException(
        `User not found, please chose userId different`,
      );
    }

    // crate notification
    const Notification = await this.prisma.notification.create({
      data: createNotificationDto,
    });

    //delete key
    await this.redisService.delByPattern('notifications:pagination:*');

    await this.sendNotification(userId, {
      title: 'Thông báo mới',
      body: 'Bạn có một thông báo mới!',
    });

    return {
      message: 'Create Notificationsuccessfully',
      Notification,
    };
  }

  async Pagination(paginationDto: PaginationNotificationDto) {
    const { page, limit, userId, read, fromDate, toDate } = paginationDto;

    const skip = (page - 1) * limit;
    const take = limit;

    // Tạo điều kiện where động
    const where: Prisma.NotificationWhereInput = {};
    if (userId) where.userId = { contains: userId, mode: 'insensitive' };
    if (typeof read === 'boolean') where.read = { equals: read };

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
      read,
      fromDate,
      toDate,
    });
    const cacheKey = `notifications:pagination:${filterKey}`;

    //  get data from key in redis
    const cachedString = await this.redisService.get(cacheKey);

    if (cachedString) {
      const cached: NotificationPaginationCache =
        NotificationPaginationCacheSchema.parse(JSON.parse(cachedString));
      return cached;
    }

    // Query DB
    const notifications = await this.prisma.notification.findMany({
      skip,
      take,
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // totalPages
    const totalCount = await this.prisma.notification.count({ where });

    // Return seccessfull result
    const result = {
      message: 'Get Pagination successfully',
      notifications,
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

  async findOne(notificationId: string) {
    //chgeck exits Notification
    const exitsNotification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!exitsNotification) {
      throw new NotFoundException(
        `Notification with id ${notificationId} not found`,
      );
    }

    // cache
    const cacheKey = `notification:findOne:id=${notificationId}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: NotificationIDCache = NotificationIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'Notification detail',
      notification: exitsNotification,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updateNotification(
    notificationId: string,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    //check exits Notification
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existingNotification) {
      throw new NotFoundException(
        `Cannot update. Notification with id ${notificationId} not found`,
      );
    }

    // Query DB
    const updateNotification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: updateNotificationDto,
    });

    //delete key
    await this.redisService.delByPattern('notifications:pagination:*');
    await this.redisService.del(`notification:findOne:id=${notificationId}`);

    return {
      message: 'Notification updated successfully',
      data: updateNotification,
    };
  }

  async removeNotificationId(notificationId: string) {
    // check exits Notification
    const existingNotification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existingNotification) {
      throw new NotFoundException(
        `Cannot delete. Notification with id ${notificationId} not found`,
      );
    }

    // Query DB
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    //delete key
    await this.redisService.delByPattern('notifications:pagination:*');
    await this.redisService.del(`notification:findOne:id=${notificationId}`);

    return {
      message: 'Notification deleted successfully',
    };
  }

  async isNotificationOfUser(notificationId: string, userId: string) {
    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    return !!existingNotification; // true nếu tồn tại
  }
}
