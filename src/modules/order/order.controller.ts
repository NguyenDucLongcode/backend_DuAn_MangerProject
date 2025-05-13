import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationOrderDto } from './dto/pagination-order.dto';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('create')
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get('pagination')
  Pagination(@Query() paginationDto: PaginationOrderDto) {
    return this.orderService.Pagination(paginationDto);
  }

  @Get()
  findOne(@Query('id') id: string) {
    return this.orderService.findOrderById(id);
  }

  @Patch('update')
  update(@Query('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.updateOrder(id, updateOrderDto);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.orderService.removeOrder(id);
  }
}
