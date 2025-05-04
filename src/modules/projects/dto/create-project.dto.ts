import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  //validate groupId
  @IsNotEmpty({ message: 'GroupId không được để trống' })
  @IsString({ message: 'GroupId phải là 1 chuỗi' })
  groupId!: string;

  //validate name
  @IsNotEmpty({ message: 'Name không được để trống' })
  @IsString({ message: 'Name phải là 1 chuỗi' })
  name!: string;

  // validate description
  @IsOptional()
  @IsString({ message: 'Description phải là 1 chuỗi' })
  description?: string;
}
