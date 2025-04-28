import { Module } from '@nestjs/common';
import { GroupLeaderService } from './group-leader.service';
import { GroupLeaderController } from './group-leader.controller';

@Module({
  controllers: [GroupLeaderController],
  providers: [GroupLeaderService],
})
export class GroupLeaderModule {}
