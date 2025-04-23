import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenCleanupService } from './token-cleanup.service';
import { UserCleanupService } from './user-cleanup.service';

@Module({
  imports: [ScheduleModule.forRoot()], // config cron job module
  providers: [TokenCleanupService, UserCleanupService], //  cron job will have import at hear
})
export class CronJobsModule {}
