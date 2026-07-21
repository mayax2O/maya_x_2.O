import type { Admin } from "@prisma/client";

/**
 * Public shape of an Admin — deliberately omits `passwordHash`, which must
 * never leave the service layer.
 */
export interface AdminResponse {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toAdminResponse(admin: Admin): AdminResponse {
  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    isActive: admin.isActive,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}
