import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  PASSWORD_STRENGTH_MESSAGE,
  PasswordStrengthRegex,
} from '@/common/constants';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là một chuỗi' })
  @Matches(PasswordStrengthRegex, {
    message: PASSWORD_STRENGTH_MESSAGE,
  })
  newPassword!: string;
}
