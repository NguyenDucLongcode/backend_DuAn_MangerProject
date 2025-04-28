import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';

import { toEmptyStringAsUndefined, toInt } from '@/common/utils/transform.dto';

export class PaginationProjectDto {
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

  //validate GroupId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'GroupId phải là 1 chuỗi' })
  groupId?: string;
}
