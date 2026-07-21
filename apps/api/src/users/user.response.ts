import type { User } from "@prisma/client";

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
