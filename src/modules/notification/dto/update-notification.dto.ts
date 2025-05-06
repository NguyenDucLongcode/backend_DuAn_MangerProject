import { toBool } from '@/common/utils/transform.dto';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationDto {
  // validate message
  @IsNotEmpty({ message: 'Message không được để trống' })
  @IsString({ message: 'Message phải là 1 chuỗi' })
  message!: string;

  // validate read
  @IsOptional()
  @toBool()
  @IsBoolean({ message: 'Read phải là kiểu boolean' })
  read?: boolean;
}
