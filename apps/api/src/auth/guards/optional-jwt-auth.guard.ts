import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Like JwtAuthGuard, but never rejects the request: a missing, malformed,
 * or expired access token simply leaves `request.user` undefined instead
 * of throwing 401. Used by endpoints that accept both a Guest (no token)
 * and a Member (valid token) — e.g. POST /booking-requests — so CurrentUser
 * can report "no principal" instead of the route needing two variants.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  override handleRequest<TUser = unknown>(
    _err: unknown,
    user: TUser,
  ): TUser | undefined {
    return user || undefined;
  }
}
