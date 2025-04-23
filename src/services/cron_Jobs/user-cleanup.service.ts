import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserCleanupService {
  private readonly logger = new Logger(UserCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Cron job that runs at 2 AM every day (Daily cleanup of expired and revoked tokens)
  @Cron('0 2 * * *')
  async handleUserCleanup() {
    const now = new Date();
    // Calculate the date and time from 7 days ago
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.user.deleteMany({
      where: {
        isActive: false, //User not activated
        createdAt: {
          lt: sevenDaysAgo, // User has not been activated for more than 7 days
        },
      },
    });
    // Log the result of how many tokens were deleted
    this.logger.log(
      `Đã xoá ${result.count} tài khoản chưa xác thực sau 7 ngày.`,
    );
  }
}
