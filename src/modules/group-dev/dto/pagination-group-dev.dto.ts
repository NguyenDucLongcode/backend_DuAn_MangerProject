import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';

import { GroupVisibilityEnum } from '@prisma/client';
import {
  toEmptyStringAsUndefined,
  toInt,
  toIntOrUndefined,
} from '@/common/utils/transform.dto';

export class PaginationGroupDevDto {
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

  // valid Visibility
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(GroupVisibilityEnum, {
    message: 'Khả năng hiển thị phải là PRIVATE, PUBLIC, RESTRICTED',
  })
  visibility!: GroupVisibilityEnum;

  // validate maxMembers
  @IsOptional()
  @toIntOrUndefined()
  @IsInt({ message: 'Số thành viên phải là một số nguyên' })
  @Min(1, { message: 'Số thành viên phải lớn hơn hoặc bằng 1' })
  maxMembers!: number;
}
