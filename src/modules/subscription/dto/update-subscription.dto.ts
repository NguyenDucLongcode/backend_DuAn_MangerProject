import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';
import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';

export class UpdateSubscriptionDto {
  // validate plan
  @IsNotEmpty({ message: 'plan không được để trống' })
  @toEmptyStringAsUndefined()
  @IsEnum(SubscriptionPlan, {
    message: 'Vai trò phải là FREE, BASIC, PRO, ENTERPRISE',
  })
  plan!: SubscriptionPlan;

  @IsNotEmpty({ message: 'expiresAt không được để trống' })
  @IsDateString({}, { message: 'Thời hạn hết hạn phải đúng định dạng ISO' })
  expiresAt!: string;

  @IsNotEmpty({ message: 'price không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá gói đăng kí phải là số' })
  @Min(1, { message: 'Giá phải >=1' })
  price!: number;
}
