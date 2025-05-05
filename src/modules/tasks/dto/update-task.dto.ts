import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';
import { TaskStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  //validate projectId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'ProjectId phải là 1 chuỗi' })
  projectId!: string;

  //validate UserId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  assignedTo?: string;

  // validate title
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'Title phải là 1 chuỗi' })
  title!: string;

  // validate description
  @IsOptional()
  @IsString({ message: 'Description phải là 1 chuỗi' })
  description?: string;

  // validate status
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(TaskStatus, {
    message: 'Vai trò phải là PENDING,  IN_PROGRESS, COMPLETED',
  })
  status?: TaskStatus;

  //validate dueDate
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsDateString({}, { message: 'Hạn hoàn thành phải đúng định dạng ISO date' })
  dueDate?: string;
}
