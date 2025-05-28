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
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@/enums/role.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/types/jwt-payload.interface';
import { checkPermission } from '@/common/utils/role/auth-utils';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Roles(Role.ADMIN, Role.LEADER, Role.CODER, Role.CUSTOMER)
  @Post('create')
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createPaymet(createPaymentDto);
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
    const isPayment = await this.paymentService.isPaymentOfUser(id, user.id);
    checkPermission(user, isPayment, [Role.ADMIN]);

    return this.paymentService.findPaymentById(id);
  }

  @Patch('update')
  async update(
    @Query('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Kiểm tra quyền truy cập với role và id
    const isPayment = await this.paymentService.isPaymentOfUser(id, user.id);
    checkPermission(user, isPayment, [Role.ADMIN]);

    return this.paymentService.updatePayment(id, updatePaymentDto);
  }

  @Roles(Role.ADMIN)
  @Delete('delete')
  remove(@Query('id') id: string) {
    return this.paymentService.removePayment(id);
  }
}
