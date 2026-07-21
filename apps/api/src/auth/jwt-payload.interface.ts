export type PrincipalType = "user" | "admin";

/** Claims of a short-lived access token — what JwtStrategy validates and exposes as `request.user`. */
export interface AccessTokenPayload {
  sub: string;
  type: PrincipalType;
  /** "user" or "admin" (base type) plus, for admins, any fine-grained role names. */
  roles: string[];
}

/** Claims of a long-lived refresh token. `jti` is the corresponding refresh_tokens.id row. */
export interface RefreshTokenPayload {
  sub: string;
  type: PrincipalType;
  jti: string;
}
