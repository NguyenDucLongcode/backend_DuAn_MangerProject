import {
  IsEnum,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
} from 'class-validator';
import { UserRoleEnum } from '@prisma/client'; // Import UserRoleEnum từ Prisma

export class CreateUserDto {
  // validEmail
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  // validName
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name!: string;

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

  // validPhone
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ (VN)' }) // Kiểm tra số điện thoại VN
  phone!: string;

  // validAddress
  @IsOptional()
  address?: string;

  // validGender
  @IsOptional()
  @IsEnum(['Nam', 'Nữ'], { message: 'Giới tính phải là Nam hoặc Nữ' })
  gender?: string;

  // validRole
  @IsOptional()
  @IsEnum(UserRoleEnum, {
    message: 'Vai trò phải là CUSTOMER, ADMIN, LEADER, CODER',
  })
  role?: UserRoleEnum;
}
