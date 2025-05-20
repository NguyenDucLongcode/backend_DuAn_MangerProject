import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsNotEmpty,
} from 'class-validator';

import { toEmptyStringAsUndefined, toInt } from '@/common/utils/transform.dto';

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

  //validate projectId
  @IsNotEmpty({ message: 'ProjectId phải là 1 chuỗi' })
  @IsString({ message: 'ProjectId phải là 1 chuỗi' })
  projectId!: string;

  //validate filename
  @IsOptional()
  @IsString({ message: 'FIle Name phải là 1 chuỗi' })
  filename?: string;

  // validate fileType
  @IsOptional()
  @toEmptyStringAsUndefined()
  fileType?: string;

  @IsOptional()
  @IsString({ message: 'fromDate phải là chuỗi ngày hợp lệ (ISO)' })
  fromDate?: string;

  @IsOptional()
  @IsString({ message: 'toDate phải là chuỗi ngày hợp lệ (ISO)' })
  toDate?: string;
}
