import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  // validate userId
  @IsNotEmpty({ message: 'UserId không được để trống' })
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  userId!: string;

  // validate totalAmount
  @IsNotEmpty({ message: 'Tổng tiền không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng tiền phải là một số' })
  @Min(0, { message: 'Limit phải lớn hơn hoặc bằng 0' })
  totalAmount!: number;
}
