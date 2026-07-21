import type { PrincipalType } from "./jwt-payload.interface";

export interface AuthUserResponse {
  id: string;
  email: string;
  fullName: string;
  type: PrincipalType;
  roles: string[];
}

export interface AuthTokenResponse {
  accessToken: string;
  user: AuthUserResponse;
}

export function toAuthUserResponse(
  principal: { id: string; email: string; fullName: string },
  type: PrincipalType,
  roles: string[],
): AuthUserResponse {
  return {
    id: principal.id,
    email: principal.email,
    fullName: principal.fullName,
    type,
    roles,
  };
}
