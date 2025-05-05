import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';
import { GroupVisibilityEnum } from '@prisma/client';

import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { toIntOrUndefined } from '../../../common/utils/transform.dto';

export class UpdateGroupDevDto {
  // valide Name
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'Tên phải là một chuỗi văn bản' })
  name!: string;

  // validate description
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'Mô tả phải là một chuỗi văn bản' })
  description!: string;

  //validate visibility
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
