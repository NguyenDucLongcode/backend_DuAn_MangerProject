import { Controller, Get, Post, Body, Delete, Query } from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { JoinGroupMemberDto } from './dto/join-group-member.dto';

@Controller('group-member')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @Post('join')
  create(@Body() joinGroupMemberDto: JoinGroupMemberDto) {
    return this.groupMemberService.joinGroup(joinGroupMemberDto);
  }

  @Get('list')
  findOne(@Query('groupId') groupId: string) {
    return this.groupMemberService.listMembersByGroup(groupId);
  }

  @Delete('leave')
  remove(@Query('groupId') groupId: string, @Query('userId') userId: string) {
    return this.groupMemberService.leaveGroup(groupId, userId);
  }
}
