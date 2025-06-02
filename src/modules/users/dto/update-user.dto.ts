import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { UserRoleEnum } from '@prisma/client'; // Import UserRoleEnum từ Prisma

import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';

export class UpdateUserDto {
  // validName
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsString({ message: 'Tên phải là 1 chỗi' })
  name?: string;

  // validPhone
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsPhoneNumber('VN', { message: 'Số điện thoại không hợp lệ (VN)' }) // Kiểm tra số điện thoại VN
  phone?: string;

  // validAddress
  @IsOptional()
  @toEmptyStringAsUndefined()
  address?: string;

  // validGender
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(['Nam', 'Nữ'], { message: 'Giới tính phải là Nam hoặc Nữ' })
  gender?: string;
}
