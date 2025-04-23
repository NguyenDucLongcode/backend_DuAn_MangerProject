// token-cleanup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Cron job that runs at 2 AM every day (Daily cleanup of expired and revoked tokens)
  @Cron('0 2 * * *')
  async handleTokenCleanup() {
    const now = new Date();
    // Calculate the date and time from 7 days ago
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Query to delete refresh tokens that are either revoked or expired for more than 7 days
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { revoked: true, createdAt: { lt: sevenDaysAgo } }, // Token is revoked and older than 7 days
          { expiresAt: { lt: sevenDaysAgo } }, // Token's expiration date is older than 7 days
        ],
      },
    });

    // Log the result of how many tokens were deleted
    this.logger.log(` Deleted ${result.count} old refresh tokens`);
  }
}
