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
