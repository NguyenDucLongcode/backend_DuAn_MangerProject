import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOrderDto {
  // validate totalAmount
  @IsNotEmpty({ message: 'Tổng tiền không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tổng tiền phải là một số' })
  @Min(0, { message: 'Limit phải lớn hơn hoặc bằng 0' })
  totalAmount!: number;
}
