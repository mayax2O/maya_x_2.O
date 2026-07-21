import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Requires a valid access token (Authorization: Bearer ...). Reshapes
 * passport-jwt's default failure into the app's standard error envelope
 * (via DomainHttpExceptionFilter on the controller) instead of Passport's
 * generic body.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    void info;
    void context;
    void status;
    if (err || !user) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "A valid access token is required.",
      });
    }
    return user;
  }
}
