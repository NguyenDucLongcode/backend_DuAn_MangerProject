import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { GroupLeaderService } from './group-leader.service';
import { AssignGroupLeaderDto } from './dto/assign-group-leader.dto';
import { ChangeGroupLeaderDto } from './dto/change-group-leader.dto';

@Controller('group-leader')
export class GroupLeaderController {
  constructor(private readonly groupLeaderService: GroupLeaderService) {}

  @Post('assign')
  create(@Body() assignGroupLeaderDto: AssignGroupLeaderDto) {
    return this.groupLeaderService.assignLeader(assignGroupLeaderDto);
  }

  @Get('by-group')
  findLeadel(@Query('groupId') groupId: string) {
    return this.groupLeaderService.findLeaderByGroup(groupId);
  }

  @Patch('change')
  update(
    @Query('groupId') id: string,
    @Body() changeGroupDevDto: ChangeGroupLeaderDto,
  ) {
    return this.groupLeaderService.changeLeader(id, changeGroupDevDto);
  }

  @Delete('remove')
  remove(@Query('groupId') id: string) {
    return this.groupLeaderService.removeLeader(id);
  }
}
