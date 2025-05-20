import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class PaymentGatewayService {
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
    await this.redisService.sadd(`socket:payment:user:${userId}`, socketId);
  }

  // Xóa socket khi user ngắt kết nối
  async removeSocket(socketId: string) {
    // 1. Lấy tất cả các key Redis có dạng "socket:user:*" (gồm cả notification, chat, v.v.)
    const userKeys = await this.redisService.scanKeys('socket:payment:user:*');

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
    const socketIds = await this.redisService.smembers(
      `socket:payment:user:${userId}`,
    );

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
}
