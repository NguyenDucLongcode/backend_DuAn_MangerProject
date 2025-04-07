import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateAuthDto {
  // validUsername
  @IsNotEmpty({ message: 'Username không được để trống' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  username!: string;

  // validPassword
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là một chuỗi' })
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Mật khẩu phải có ít nhất 8 ký tự, một chữ hoa, một chữ thường, một số và một ký tự đặc biệt',
    },
  )
  password!: string;
}
