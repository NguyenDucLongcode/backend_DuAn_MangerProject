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

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('create')
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationNotificationDto) {
    return this.notificationService.Pagination(paginationDto);
  }

  @Get()
  findOne(@Query('notificationId') notificationId: string) {
    return this.notificationService.findOne(notificationId);
  }

  @Patch('update')
  update(
    @Query('notificationId') notificationId: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationService.updateNotification(
      notificationId,
      updateNotificationDto,
    );
  }

  @Delete('delete')
  remove(@Query('notificationId') notificationId: string) {
    return this.notificationService.removeNotificationId(notificationId);
  }
}
