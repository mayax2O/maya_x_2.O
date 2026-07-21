import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

import type { AccessTokenPayload } from "../jwt-payload.interface";

interface RequestWithUser {
  user: AccessTokenPayload;
}

/** Extracts the validated access token payload JwtAuthGuard attached to the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
