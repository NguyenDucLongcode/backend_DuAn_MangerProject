import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';
import { IsOptional, IsString } from 'class-validator';
export class UpdateProjectDto {
  //validate groupId
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'GroupId phải là 1 chuỗi' })
  groupId?: string;

  //validate name
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'Name phải là 1 chuỗi' })
  name?: string;

  // validate description
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'Description phải là 1 chuỗi' })
  description?: string;
}
