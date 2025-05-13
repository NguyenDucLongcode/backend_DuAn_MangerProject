import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
} from 'class-validator';

import { toEmptyStringAsUndefined, toInt } from '@/common/utils/transform.dto';
import { PaymentStatus, TaskStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class PaginationOrderDto {
  //validate limmit
  @IsOptional()
  @toInt()
  @IsInt({ message: 'Limit phải là một số nguyên' })
  @Min(1, { message: 'Limit phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Limit tối đa là 100' })
  limit: number = 5;

  //validate page
  @IsOptional()
  @toInt()
  @IsInt({ message: 'Page phải là một số nguyên' })
  @Min(1, { message: 'Page phải lớn hơn hoặc bằng 1' })
  page: number = 1;

  //validate userId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  userId?: string;

  @IsOptional()
  @toEmptyStringAsUndefined()
  @Type(() => Number)
  @IsNumber({}, { message: 'minAmount phải là số' })
  minAmount?: number;

  @IsOptional()
  @toEmptyStringAsUndefined()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxAmount phải là số' })
  maxAmount?: number;

  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(PaymentStatus, {
    message: 'Trạng thái thanh toán phải là PENDING, COMPLETED, FAILED',
  })
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString({ message: 'fromDate phải là chuỗi ngày hợp lệ (ISO)' })
  fromDate?: string;

  @IsOptional()
  @IsString({ message: 'toDate phải là chuỗi ngày hợp lệ (ISO)' })
  toDate?: string;
}
