import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

/**
 * Minimal structured access log (method, path, status, duration) via
 * Nest's own Logger — deliberately not morgan/winston: one more dependency
 * isn't worth it for a single log line per request. Applied app-wide in
 * AppModule.configure().
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = performance.now();
    const { method, originalUrl } = req;

    res.on("finish", () => {
      const durationMs = Math.round(performance.now() - startedAt);
      this.logger.log(
        `${method} ${originalUrl} ${res.statusCode} +${durationMs}ms`,
      );
    });

    next();
  }
}
