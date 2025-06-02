import { ForbiddenException } from '@nestjs/common';
import { Role } from '@/enums/role.enum';
import { JwtPayload } from '@/types/jwt-payload.interface';

export function checkPermission(
  currentUser: JwtPayload | undefined,
  isOwnerOrHasAccess: boolean,
  allowedRoles: Role[] = [],
) {
  if (!currentUser) {
    throw new ForbiddenException('Người dùng chưa xác thực');
  }

  // Nếu người dùng có quyền trong danh sách
  if (allowedRoles.includes(currentUser.role)) {
    return;
  }

  // Nếu không có quyền và cũng không phải là chủ sở hữu
  if (!isOwnerOrHasAccess) {
    throw new ForbiddenException(
      'Không được phép thao tác với dữ liệu người khác',
    );
  }
}
