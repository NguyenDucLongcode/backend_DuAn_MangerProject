import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

//DTO
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  PaginationNotificationDto,
} from './dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Roles(Role.ADMIN, Role.LEADER)
  @Post('create')
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Roles(Role.ADMIN)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationNotificationDto) {
    return this.notificationService.Pagination(paginationDto);
  }

  @Get()
  async findOne(
    @Query('notificationId') notificationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    /**
     * Kiểm tra quyền truy cập cho một user
     * @param user Thông tin người dùng hiện tại
     * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
     * @param allowedRoles Các role có toàn quyền
     */
    const isNotification = await this.notificationService.isNotificationOfUser(
      notificationId,
      user.id,
    );
    checkPermission(user, isNotification, [Role.ADMIN, Role.LEADER]);
    return this.notificationService.findOne(notificationId);
  }

  @Patch('update')
  async update(
    @Query('notificationId') notificationId: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Kiểm tra quyền truy cập cho một user
    const isNotification = await this.notificationService.isNotificationOfUser(
      notificationId,
      user.id,
    );
    checkPermission(user, isNotification, [Role.ADMIN]);

    return this.notificationService.updateNotification(
      notificationId,
      updateNotificationDto,
    );
  }

  @Delete('delete')
  async remove(
    @Query('notificationId') notificationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // Kiểm tra quyền truy cập cho một user
    const isNotification = await this.notificationService.isNotificationOfUser(
      notificationId,
      user.id,
    );
    checkPermission(user, isNotification, [Role.ADMIN]);
    return this.notificationService.removeNotificationId(notificationId);
  }
}
