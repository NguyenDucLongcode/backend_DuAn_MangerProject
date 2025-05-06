import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReviewDto {
  //validate userId
  @IsNotEmpty({ message: 'UserId không được để trống' })
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  userId!: string;

  //validate projectId
  @IsNotEmpty({ message: 'ProjectId không được để trống' })
  @IsString({ message: 'ProjectId phải là 1 chuỗi' })
  projectId!: string;

  // validate plan
  @IsNotEmpty()
  @Type(() => Number)
  @IsEnum([1, 2, 3, 4, 5], {
    message: 'Rateting phải từ 1 -> 5',
  })
  rating!: number;

  // validate comment
  @IsOptional()
  @IsString({ message: 'comment phải là 1 chuỗi' })
  comment?: string;
}
