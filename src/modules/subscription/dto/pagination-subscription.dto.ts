import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';

import { toEmptyStringAsUndefined, toInt } from '@/common/utils/transform.dto';
import { SubscriptionPlan } from '@prisma/client';

export class PaginationSubscriptionDto {
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

  // validate plan
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(SubscriptionPlan, {
    message: 'Vai trò phải là FREE, BASIC, PRO, ENTERPRISE',
  })
  plan?: SubscriptionPlan;

  @IsOptional()
  @IsString({ message: 'fromDate phải là chuỗi ngày hợp lệ (ISO)' })
  fromDate?: string;

  @IsOptional()
  @IsString({ message: 'toDate phải là chuỗi ngày hợp lệ (ISO)' })
  toDate?: string;
}
