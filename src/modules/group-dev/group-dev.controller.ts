import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { GroupDevService } from './group-dev.service';

import {
  CreateGroupDevDto,
  UpdateGroupDevDto,
  PaginationGroupDevDto,
} from './dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileAvatarFilter } from '@/cloudinary/filter/filter.user.avatar';
import { MulterFile } from '@/types/multer-file';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('group-dev')
export class GroupDevController {
  constructor(private readonly groupDevService: GroupDevService) {}

  @Roles(Role.ADMIN, Role.LEADER)
  @Post('create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1 },
      fileFilter: imageFileAvatarFilter,
    }),
  )
  create(
    @Body() createGroupDevDto: CreateGroupDevDto,
    @UploadedFile() file?: MulterFile,
  ) {
    return this.groupDevService.createGroupDev(createGroupDevDto, file);
  }

  @Roles(Role.ADMIN)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationGroupDevDto) {
    return this.groupDevService.Pagination(paginationDto);
  }

  @Get()
  async findOne(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập cho một user
     * @param user Thông tin người dùng hiện tại
     * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
     * @param allowedRoles Các role có toàn quyền
     */
    const isMember = await this.groupDevService.isUserInGroup(id, user.id);
    checkPermission(user, isMember, [Role.ADMIN, Role.LEADER]);
    return this.groupDevService.findOne(id);
  }

  @Patch('update')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1 },
      fileFilter: imageFileAvatarFilter,
    }),
  )
  async update(
    @Query('id') id: string,
    @Body() updateGroupDevDto: UpdateGroupDevDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: MulterFile,
  ) {
    /**
     * Kiểm tra quyền truy cập cho một user
     * @param user Thông tin người dùng hiện tại
     * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
     * @param allowedRoles Các role có toàn quyền
     */
    const isMember = await this.groupDevService.isLeaderInGroup(id, user.id);
    checkPermission(user, isMember, [Role.ADMIN]);
    return this.groupDevService.updateGroupDev(id, updateGroupDevDto, file);
  }

  @Delete('delete')
  async remove(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập cho một user
     * @param user Thông tin người dùng hiện tại
     * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
     * @param allowedRoles Các role có toàn quyền
     */
    const isMember = await this.groupDevService.isLeaderInGroup(id, user.id);
    checkPermission(user, isMember, [Role.ADMIN]);
    return this.groupDevService.removeGroupDev(id);
  }
}
