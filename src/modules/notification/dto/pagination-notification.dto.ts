import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsBoolean,
} from 'class-validator';

import {
  toBool,
  toEmptyStringAsUndefined,
  toInt,
} from '@/common/utils/transform.dto';

export class PaginationNotificationDto {
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

  // validate read
  @IsOptional()
  @toBool()
  @IsBoolean({ message: 'Read phải là kiểu boolean' })
  read?: boolean;

  @IsOptional()
  @IsString({ message: 'fromDate phải là chuỗi ngày hợp lệ (ISO)' })
  fromDate?: string;

  @IsOptional()
  @IsString({ message: 'toDate phải là chuỗi ngày hợp lệ (ISO)' })
  toDate?: string;
}
