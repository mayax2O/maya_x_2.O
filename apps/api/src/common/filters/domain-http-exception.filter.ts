import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

interface MinimalResponse {
  status: (code: number) => { json: (body: unknown) => void };
}

interface ErrorBody {
  code: string;
  message: string;
  details: unknown[];
}

const DEFAULT_CODES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "UNPROCESSABLE_ENTITY",
};

/**
 * Reshapes Nest's default HttpException body into the REST API
 * Specification's standard error envelope — { error: { code, message,
 * details } } — for the endpoints this milestone adds. Scoped to the
 * Admins/Users controllers via @UseFilters rather than applied app-wide:
 * the existing M0/M1A endpoints (root, health) predate this envelope and
 * changing their response shape is outside M1B's scope.
 */
@Catch(HttpException)
export class DomainHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<MinimalResponse>();
    const status = exception.getStatus();

    response.status(status).json({
      error: this.toErrorBody(status, exception.getResponse()),
    });
  }

  private toErrorBody(status: number, body: string | object): ErrorBody {
    const fallbackCode = DEFAULT_CODES[status] ?? "INTERNAL_ERROR";

    if (typeof body === "string") {
      return { code: fallbackCode, message: body, details: [] };
    }

    const { code, message, details } = body as Record<string, unknown>;

    if (Array.isArray(message)) {
      // class-validator's ValidationPipe default shape: `message` is an
      // array of human-readable constraint violations.
      return {
        code: typeof code === "string" ? code : "VALIDATION_ERROR",
        message: "Validation failed.",
        details: message,
      };
    }

    return {
      code: typeof code === "string" ? code : fallbackCode,
      message: typeof message === "string" ? message : "Unexpected error.",
      details: Array.isArray(details) ? details : [],
    };
  }
}
