import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFileDto {
  //validate projectId
  @IsNotEmpty({ message: 'ProjectId không được để trống' })
  @IsString({ message: 'ProjectId phải là 1 chuỗi' })
  projectId!: string;
}
