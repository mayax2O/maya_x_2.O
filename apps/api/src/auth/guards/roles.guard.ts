import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  type CanActivate,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AccessTokenPayload } from "../jwt-payload.interface";
import { ROLES_KEY } from "../decorators/roles.decorator";

interface RequestWithUser {
  user?: AccessTokenPayload;
}

/** Must run after JwtAuthGuard, which populates `request.user`. Allows the request if the token's roles intersect the route's @Roles(...) list; allows unconditionally if no roles were declared. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRoles = request.user?.roles ?? [];
    const isAllowed = requiredRoles.some((role) => userRoles.includes(role));

    if (!isAllowed) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
      });
    }

    return true;
  }
}
