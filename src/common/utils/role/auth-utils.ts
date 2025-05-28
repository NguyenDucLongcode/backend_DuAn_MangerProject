import { ForbiddenException } from '@nestjs/common';
import { Role } from '@/enums/role.enum';
import { JwtPayload } from '@/types/jwt-payload.interface';

/**
 * Kiểm tra quyền truy cập với role và id
 * @param user Thông tin user hiện tại (jwt payload)
 * @param targetId Id của đối tượng đang thao tác
 * @param allowedRoles Các role được phép thao tác không cần so sánh id
 * @param checkOwnUser Nếu true, user chỉ được thao tác với chính mình nếu không thuộc allowedRoles
 */
export function checkPermissionForUser(
  user: JwtPayload | undefined,
  targetId: string,
  allowedRoles: Role[] = [],
  checkOwnUser = true,
) {
  if (!user) {
    throw new ForbiddenException('Người dùng chưa xác thực');
  }

  // Nếu user có role trong allowedRoles thì được phép thao tác
  if (allowedRoles.includes(user.role)) {
    return;
  }

  // Nếu user không nằm trong allowedRoles mà checkOwnUser bật, thì chỉ được thao tác với chính mình
  if (checkOwnUser && user.id !== targetId) {
    throw new ForbiddenException('Không được thao tác với dữ liệu người khác');
  }
}

/**
 * Kiểm tra quyền truy cập cho một user
 * @param user Thông tin người dùng hiện tại
 * @param isOwnerOrMember User có đang thao tác với dữ liệu của chính mình/nhóm mình không?
 * @param allowedRoles Các role có toàn quyền
 */
export function checkPermission(
  user: JwtPayload | undefined,
  isOwnerOrMember: boolean,
  allowedRoles: Role[] = [],
) {
  if (!user) {
    throw new ForbiddenException('Người dùng chưa xác thực');
  }

  if (allowedRoles.includes(user.role)) {
    return; // Admin hoặc Leader
  }

  if (!isOwnerOrMember) {
    throw new ForbiddenException('Không được thao tác với dữ liệu người khác');
  }
}
