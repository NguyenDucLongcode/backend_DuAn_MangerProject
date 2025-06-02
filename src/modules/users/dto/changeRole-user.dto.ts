import { IsEnum, IsOptional } from 'class-validator';
import { UserRoleEnum } from '@prisma/client'; // Import UserRoleEnum từ Prisma
import { toEmptyStringAsUndefined } from '@/common/utils/transform.dto';

export class ChangeRoleUserDto {
  // validRole
  @IsOptional()
  @toEmptyStringAsUndefined()
  @IsEnum(UserRoleEnum, {
    message: 'Vai trò phải là CUSTOMER, ADMIN, LEADER, CODER',
  })
  role!: UserRoleEnum;
}
