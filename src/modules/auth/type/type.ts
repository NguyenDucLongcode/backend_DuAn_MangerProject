import { UserRoleEnum } from '@prisma/client';
import { Request } from 'express';
export interface User {
  id: string;
  name: string | null;
  email: string;
  password: string;
  phone: string | null;
  address: string | null;
  gender: string | null;
  role: UserRoleEnum;
  createdAt: Date | string;
}

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface JwtPayload {
  sub: string;
  username: string;
}

export interface CustomJwtPayload {
  sub: string;
  username: string;
  iat?: number;
  exp?: number;
}

export interface JwtDecodedPayload extends CustomJwtPayload {
  iat: number;
  exp: number;
}
