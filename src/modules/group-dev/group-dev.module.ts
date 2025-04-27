import { Module } from '@nestjs/common';
import { GroupDevService } from './group-dev.service';
import { GroupDevController } from './group-dev.controller';

@Module({
  controllers: [GroupDevController],
  providers: [GroupDevService],
})
export class GroupDevModule {}
