import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPaymet(createPaymentDto);
  }

  @Get()
  findOne(@Query('id') id: string) {
    return this.paymentService.findPaymentById(id);
  }

  @Patch('update')
  update(@Query('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.updatePayment(id, updatePaymentDto);
  }

  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.paymentService.removePayment(id);
  }
}
