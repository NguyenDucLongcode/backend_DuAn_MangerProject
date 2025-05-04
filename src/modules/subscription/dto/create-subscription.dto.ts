import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';
import { SubscriptionPlan } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSubscriptionDto {
  //validate userId
  @IsNotEmpty({ message: 'UserId không được để trống' })
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  userId!: string;

  // validate plan
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(SubscriptionPlan, {
    message: 'Vai trò phải là FREE, BASIC, PRO, ENTERPRISE',
  })
  plan?: SubscriptionPlan;

  // validate expireAt
  @IsDateString(
    {},
    { message: 'Thời hạn hết hạn phải đúng định dạng ISO date' },
  )
  expiresAt!: string;

  // validate price

  @IsNotEmpty({ message: 'Giá gói đăng kí được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá gói đăng kí phải là số' })
  @Min(1, { message: 'Price phải lớn hơn hoặc bằng 1' })
  price!: number;
}
