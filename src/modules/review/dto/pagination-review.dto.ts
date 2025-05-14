import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';

import {
  toEmptyStringAsUndefined,
  toInt,
  toIntOrUndefined,
} from '@/common/utils/transform.dto';

export class PaginationReviewDto {
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

  // validate rating
  @IsOptional()
  @toIntOrUndefined()
  @IsEnum([1, 2, 3, 4, 5], {
    message: 'Rateting phải từ 1 -> 5',
  })
  rating?: number;

  //validate userId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  userId?: string;

  //validate ProjectId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'ProjectId phải là 1 chuỗi' })
  projectId?: string;

  @IsOptional()
  @IsString({ message: 'fromDate phải là chuỗi ngày hợp lệ (ISO)' })
  fromDate?: string;

  @IsOptional()
  @IsString({ message: 'toDate phải là chuỗi ngày hợp lệ (ISO)' })
  toDate?: string;
}
