import {
  toEmptyStringAsUndefined,
  toIntOrUndefined,
} from '@/common/utils/transform.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateReviewDto {
  // validate rating
  @IsOptional()
  @toIntOrUndefined()
  @IsEnum([1, 2, 3, 4, 5], {
    message: 'Rateting phải từ 1 -> 5',
  })
  rating?: number;

  // validate comment
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'comment phải là 1 chuỗi' })
  comment?: string;
}
