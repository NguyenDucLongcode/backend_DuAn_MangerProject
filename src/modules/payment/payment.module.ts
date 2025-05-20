import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentGatewayService } from './gateway/payment.gateway.service';
import { PaymentGateway } from './gateway/payment.gateway';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PaymentGatewayService, PaymentGateway],
  exports: [PaymentGatewayService],
})
export class PaymentModule {}
