import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";

import { DatabaseService } from "../database/database.service";

export interface DatabaseHealth {
  status: "ok";
  database: "connected";
  latencyMs: number;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly database: DatabaseService) {}

  async checkDatabase(): Promise<DatabaseHealth> {
    const startedAt = performance.now();

    try {
      await this.database.query("SELECT 1");
    } catch (error) {
      // Never leak the connection string or driver internals to a caller;
      // full detail goes to the server log only.
      this.logger.error(
        "Database health check failed",
        error instanceof Error ? error.stack : error,
      );
      throw new ServiceUnavailableException(
        "Database connection is unavailable",
      );
    }

    return {
      status: "ok",
      database: "connected",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}
