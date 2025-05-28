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
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('group-leader')
export class GroupLeaderController {
  constructor(private readonly groupLeaderService: GroupLeaderService) {}

  @Roles(Role.ADMIN)
  @Post('assign')
  create(@Body() assignGroupLeaderDto: AssignGroupLeaderDto) {
    return this.groupLeaderService.assignLeader(assignGroupLeaderDto);
  }

  @Roles(Role.ADMIN, Role.LEADER)
  @Get('by-group')
  findLeadel(@Query('groupId') groupId: string) {
    return this.groupLeaderService.findLeaderByGroup(groupId);
  }

  @Patch('change')
  async update(
    @Query('groupId') id: string,
    @Body() changeGroupDevDto: ChangeGroupLeaderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    /**
     * Kiểm tra quyền truy cập cho một user
     * @param user Thông tin người dùng hiện tại
     * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
     * @param allowedRoles Các role có toàn quyền
     */
    const isLeader = await this.groupLeaderService.isLeaderInGroup(id, user.id);
    checkPermission(user, isLeader, [Role.ADMIN]);
    return this.groupLeaderService.changeLeader(id, changeGroupDevDto);
  }

  @Delete('remove')
  async remove(@Query('groupId') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập cho một user
     * @param user Thông tin người dùng hiện tại
     * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
     * @param allowedRoles Các role có toàn quyền
     */
    const isLeader = await this.groupLeaderService.isLeaderInGroup(id, user.id);
    checkPermission(user, isLeader, [Role.ADMIN]);
    return this.groupLeaderService.removeLeader(id);
  }
}
