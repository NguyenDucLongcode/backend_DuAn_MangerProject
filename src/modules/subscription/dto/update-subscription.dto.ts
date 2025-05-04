import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';
import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString({ message: 'UserId phải là chuỗi' })
  userId?: string;

  // validate plan
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(SubscriptionPlan, {
    message: 'Vai trò phải là FREE, BASIC, PRO, ENTERPRISE',
  })
  plan?: SubscriptionPlan;

  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsDateString({}, { message: 'Thời hạn hết hạn phải đúng định dạng ISO' })
  expiresAt?: string;

  @IsOptional()
  @toEmptyStringAsUndefined()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá gói đăng kí phải là số' })
  price?: number;
}
