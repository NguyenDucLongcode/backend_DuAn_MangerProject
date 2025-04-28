import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  //validate groupId
  @IsNotEmpty()
  @IsString()
  groupId!: string;

  //validate name
  @IsNotEmpty()
  @IsString()
  name!: string;

  // validate description
  @IsOptional()
  @IsString()
  description?: string;
}
