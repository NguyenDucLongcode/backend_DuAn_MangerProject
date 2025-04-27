import { toEmptyStringAsUndefined, toInt } from '@/common/utils/transform.dto';
import { GroupVisibilityEnum } from '@prisma/client';

import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateGroupDevDto {
  // valide Name
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name!: string;

  // validate description
  @IsOptional()
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
  @IsNotEmpty({ message: 'Số thành viên không được để trống' })
  @toInt()
  @IsInt({ message: 'Số thành viên phải là một số nguyên' })
  @Min(1, { message: 'Số thành viên phải lớn hơn hoặc bằng 1' })
  maxMembers!: number;
}
