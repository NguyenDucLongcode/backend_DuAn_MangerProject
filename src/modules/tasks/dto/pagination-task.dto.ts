import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';

import { toEmptyStringAsUndefined, toInt } from '@/common/utils/transform.dto';
import { TaskStatus } from '@prisma/client';

export class PaginationTaskDto {
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

  //validate ProjectId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'project phải là 1 chuỗi' })
  projectId?: string;

  //validate assignedTo
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  assignedTo?: string;

  // validRole
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(TaskStatus, {
    message: 'Trạng thái phải là PENDING,  IN_PROGRESS, COMPLETED',
  })
  status?: TaskStatus;

  @IsOptional()
  @IsString({ message: 'fromDate phải là chuỗi ngày hợp lệ (ISO)' })
  fromDate?: string;

  @IsOptional()
  @IsString({ message: 'toDate phải là chuỗi ngày hợp lệ (ISO)' })
  toDate?: string;
}
