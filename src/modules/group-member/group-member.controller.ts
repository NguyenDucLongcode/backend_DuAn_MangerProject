import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GroupMemberService } from './group-member.service';
import { JoinGroupMemberDto } from './dto/join-group-member.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { Role } from '@/enums/role.enum';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('group-member')
export class GroupMemberController {
  constructor(private readonly groupMemberService: GroupMemberService) {}

  @Post('join')
  create(
    @Body() joinGroupMemberDto: JoinGroupMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Người dùng chỉ được tự thêm mình, trừ khi là ADMIN
    if (user.id !== joinGroupMemberDto.userId && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Không được thêm người khác vào nhóm');
    }

    return this.groupMemberService.joinGroup(joinGroupMemberDto);
  }

  @Get('list')
  async findOne(
    @Query('groupId') groupId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    /**
     * Kiểm tra quyền truy cập cho một user
     * @param user Thông tin người dùng hiện tại
     * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
     * @param allowedRoles Các role có toàn quyền
     */
    const isMember = await this.groupMemberService.isUserInGroup(
      groupId,
      user.id,
    );
    checkPermission(user, isMember, [Role.ADMIN, Role.LEADER]);
    return this.groupMemberService.listMembersByGroup(groupId);
  }

  @Delete('leave')
  async remove(
    @Query('groupId') groupId: string,
    @Query('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // Check is leader in group
    const isLeader = await this.groupMemberService.isLeaderInGroup(
      groupId,
      user.id,
    );

    //Chỉ admin/leader có quyền xóa người khác
    const isSelf = user.id === userId;
    if (!isSelf && user.role !== Role.ADMIN && !isLeader) {
      throw new ForbiddenException(
        'Chỉ admin hoặc leader mới được xoá người khác',
      );
    }

    return this.groupMemberService.leaveGroup(groupId, userId);
  }
}
