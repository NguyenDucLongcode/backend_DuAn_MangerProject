import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationOrderDto } from './dto/pagination-order.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Roles(Role.ADMIN, Role.LEADER, Role.CODER, Role.CUSTOMER)
  @Post('create')
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Roles(Role.ADMIN)
  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationOrderDto) {
    return this.orderService.Pagination(paginationDto);
  }

  @Get()
  async findOne(@Query('id') id: string, @CurrentUser() user: JwtPayload) {
    /**
     * Kiểm tra quyền truy cập với role và id
     * @param user Thông tin user hiện tại (jwt payload)
     * @param targetId Id của đối tượng thuộc paymemt
     * @param allowedRoles Các role được phép thao tác không cần so sánh id
     * @param checkOwnUser Nếu true, user chỉ được thao tác với chính mình nếu không thuộc allowedRoles
     */
    const isOrder = await this.orderService.isOrderOfUser(id, user.id);
    checkPermission(user, isOrder, [Role.ADMIN]);
    return this.orderService.findOrderById(id);
  }

  @Patch('update')
  async update(
    @Query('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Kiểm tra quyền truy cập với role và id
    const isOrder = await this.orderService.isOrderOfUser(id, user.id);
    checkPermission(user, isOrder, [Role.ADMIN]);

    return this.orderService.updateOrder(id, updateOrderDto);
  }

  @Roles(Role.ADMIN)
  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.orderService.removeOrder(id);
  }
}
