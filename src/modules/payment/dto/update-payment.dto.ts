import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';
import { PaymentStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePaymentDto {
  // validate amount
  @IsNotEmpty({ message: 'Amount không được để trống' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Amount phải là một số' })
  @Min(0, { message: 'Limit phải lớn hơn hoặc bằng 0' })
  amount!: number;

  //validate method
  @IsOptional()
  @IsString({ message: 'Method phải là 1 chuỗi' })
  method!: string;

  // validate status
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(PaymentStatus, {
    message: 'Trạng thái phải là PENDING, COMPLETED, FAILED',
  })
  status?: PaymentStatus;
}
