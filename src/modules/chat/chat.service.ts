import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class ChatService {
  private server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  bindServer(server: Server) {
    this.server = server;
  }

  async registerSocket(userId: string, socketId: string) {
    await this.redisService.sadd(`socket:chat:user:${userId}`, socketId);
  }

  async removeSocket(socketId: string) {
    const keys = await this.redisService.scanKeys('socket:chat:user:*');
    for (const key of keys) {
      const removed = await this.redisService.srem(key, socketId);
      if (removed > 0) {
        const remaining = await this.redisService.smembers(key);
        if (remaining.length === 0) {
          await this.redisService.del(key);
        }
        break;
      }
    }
  }

  async sendMessage(userId: string, payload: any) {
    const socketIds = await this.redisService.smembers(
      `socket:chat:user:${userId}`,
    );
    if (!this.server || !socketIds || socketIds.length === 0) return;

    for (const socketId of socketIds) {
      this.server.to(socketId).emit('chat:receive', payload);
    }
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
