import { toBool } from '@/common/utils/transform.dto';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  //validate userId
  @IsNotEmpty({ message: 'UserId không được để trống' })
  @IsString({ message: 'UserId phải là 1 chuỗi' })
  userId!: string;

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
