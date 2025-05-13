import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/redis/redis.service';
import {
  PaymentIDCache,
  PaymentIDCacheSchema,
} from '@/common/schemas/order_payment/payment-findOne-cache.schema';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}
  async createPaymet(createPaymentDto: CreatePaymentDto) {
    // check payment exists in DB
    const existOrder = await this.prisma.order.findUnique({
      where: { id: createPaymentDto.orderId },
    });

    if (!existOrder) {
      throw new NotFoundException(
        `Payment not found, please chose orderId different`,
      );
    }

    //check amount <= totalAmount
    if (createPaymentDto.amount > existOrder.totalAmount) {
      throw new ConflictException(
        `The amount must not exceed the total amount: ${existOrder.totalAmount}`,
      );
    }

    // create in DB
    const payment = await this.prisma.payment.create({
      data: createPaymentDto,
    });

    return {
      message: 'Create payment successfully',
      payment,
    };
  }

  async findPaymentById(id: string) {
    //check exits payment
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      throw new NotFoundException(
        `Cannot update. Payment with id ${id} not found`,
      );
    }

    // cache
    const cacheKey = `payment:findOne:id=${id}`;
    const cachedString = await this.redisService.get(cacheKey);

    // return result when key is in redis
    if (cachedString) {
      // data type casting when converting json
      const cached: PaymentIDCache = PaymentIDCacheSchema.parse(
        JSON.parse(cachedString),
      );
      return {
        ...cached,
      };
    }

    const result = {
      message: 'payment detail',
      payment: existingPayment,
    };

    await this.redisService.set(cacheKey, result, 1800); // cache trong 30 phút

    return result;
  }

  async updatePayment(id: string, updatePaymentDto: UpdatePaymentDto) {
    //check exits payment
    const { amount, method, status } = updatePaymentDto;
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      throw new NotFoundException(
        `Cannot update. Payment with id ${id} not found`,
      );
    }

    // get order by Id
    const order = await this.prisma.order.findUnique({
      where: { id: existingPayment.orderId },
    });

    //check amount <= totalAmount
    if (order && amount > order.totalAmount) {
      throw new ConflictException(
        `The amount must not exceed the total amount: ${order.totalAmount}`,
      );
    }

    //check amount = totalAmount (change COMPLETED)
    const updatedStatus =
      order && amount === order.totalAmount ? 'COMPLETED' : status;

    // Query DB
    const updatedPayment = await this.prisma.payment.update({
      where: { id },
      data: {
        amount,
        method,
        status: updatedStatus,
      },
    });

    //delete key
    await this.redisService.del(`payment:findOne:id=${id}`);

    return {
      message: 'Payment updated successfully',
      data: updatedPayment,
    };
  }

  async removePayment(id: string) {
    //check exits payment
    const existingPayment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!existingPayment) {
      throw new NotFoundException(
        `Cannot update. Payment with id ${id} not found`,
      );
    }
    // Query DB
    await this.prisma.payment.delete({
      where: { id },
    });

    //delete key
    await this.redisService.del(`payment:findOne:id=${id}`);

    return {
      message: 'Payment deleted successfully',
    };
  }
}
