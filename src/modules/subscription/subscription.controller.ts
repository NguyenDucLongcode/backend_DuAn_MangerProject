import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

// dto
import {
  PaginationSubscriptionDto,
  UpdateSubscriptionDto,
  CreateSubscriptionDto,
} from './dto';

// role
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';
import { Role } from '@/enums/role.enum';
import { Roles } from '@/common/decorators/roles.decorator';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Roles(Role.ADMIN, Role.LEADER, Role.CUSTOMER, Role.CODER)
  @Post('create')
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(createSubscriptionDto);
  }

  @Roles(Role.ADMIN)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationSubscriptionDto) {
    return this.subscriptionService.Pagination(paginationDto);
  }

  @Get()
  async findOne(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập với role và id
     * @param user Thông tin user hiện tại (jwt payload)
     * @param userId  UserId ứng với Subscription
     * @param allowedRoles Các role được phép thao tác không cần so sánh id
     * @param checkOwnUser Nếu true, user chỉ được thao tác với chính mình nếu không thuộc allowedRoles
     */
    const isSubs = await this.subscriptionService.isSubscriptionOfUser(
      id,
      user.id,
    );
    checkPermission(user, isSubs, [Role.ADMIN]);

    return this.subscriptionService.findOne(id);
  }

  @Patch('update')
  async update(
    @Query('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Kiểm tra quyền truy cập với role và id
    const isSubs = await this.subscriptionService.isSubscriptionOfUser(
      id,
      user.id,
    );
    checkPermission(user, isSubs, [Role.ADMIN]);

    return this.subscriptionService.updateSubscription(
      id,
      updateSubscriptionDto,
    );
  }

  @Roles(Role.ADMIN)
  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.subscriptionService.removeSubscription(id);
  }
}
