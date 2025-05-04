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

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('create')
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionService.createSubscription(createSubscriptionDto);
  }

  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationSubscriptionDto) {
    return this.subscriptionService.Pagination(paginationDto);
  }

  @Get()
  findOne(@Query('id') id: string) {
    return this.subscriptionService.findOne(id);
  }

  @Patch('update')
  update(
    @Query('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionService.updateSubscription(
      id,
      updateSubscriptionDto,
    );
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.subscriptionService.removeSubscription(id);
  }
}
