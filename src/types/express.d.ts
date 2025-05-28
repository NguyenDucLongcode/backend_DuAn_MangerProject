import { UserRoleEnum } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: UserRoleEnum;
    }
  }
}
