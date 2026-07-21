/**
 * Mirrors apps/api's AuthUserResponse / RegisterDto / LoginDto
 * (apps/api/src/auth). Keep these two in sync by hand until a shared
 * @maya-x/types package grows an auth domain.
 */

export type PrincipalType = "user" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  type: PrincipalType;
  roles: string[];
}

export interface LoginValues {
  email: string;
  password: string;
}

export interface RegisterValues {
  email: string;
  fullName: string;
  phone?: string;
  password: string;
}
