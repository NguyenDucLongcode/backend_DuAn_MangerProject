import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';

import { UserRoleEnum } from '@prisma/client';
import {
  toBool,
  toEmptyStringAsUndefined,
  toInt,
} from '@/common/utils/transform.dto';

export class PaginationDto {
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

  //validate UserName
  @IsOptional()
  @IsString({ message: 'Name phải là 1 chuỗi' })
  name?: string;

  // validEmail
  @IsOptional()
  @IsString({ message: 'Email phải là 1 chuỗi' })
  email?: string;

  // validRole
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(UserRoleEnum, {
    message: 'Vai trò phải là CUSTOMER, ADMIN, LEADER, CODER',
  })
  role?: string;

  // validate isActive
  @IsOptional()
  @toEmptyStringAsUndefined()
  @toBool()
  @IsBoolean({ message: 'isActive phải là true hoặc false' })
  isActive?: boolean;

  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsDateString({}, { message: 'fromDate phải là chuỗi ngày hợp lệ (ISO)' })
  fromDate?: string;

  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsDateString({}, { message: 'toDate phải là chuỗi ngày hợp lệ (ISO)' })
  toDate?: string;
}
