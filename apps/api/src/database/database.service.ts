import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, type QueryResultRow } from "pg";

import type { EnvConfig } from "../config/env.validation";

/**
 * Raw PostgreSQL connection (via `pg`), independent of Prisma.
 *
 * Why this exists alongside Prisma: Prisma Client cannot be generated
 * without at least one model in schema.prisma (a hard error, not a
 * preference), and M1A is explicitly models-free. Connection-level
 * concerns — "is the database reachable at all" — shouldn't depend on the
 * ORM's generated client or application schema anyway; this is the same
 * reason Kubernetes-style readiness probes typically bypass the ORM.
 * Prisma takes over as the query layer once M1B adds models; this service
 * remains for low-level connectivity checks (e.g. the health endpoint).
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(configService: ConfigService<EnvConfig, true>) {
    this.pool = new Pool({
      connectionString: configService.get("DATABASE_URL", { infer: true }),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    // Pool-level errors (e.g. a lost idle connection) must not crash the
    // process — pg's Pool emits these as events rather than throwing.
    this.pool.on("error", (error) => {
      this.logger.error("Unexpected idle client error", error.stack);
    });
  }

  async onModuleInit(): Promise<void> {
    // Fail fast on boot with a clear log line if credentials/network are
    // wrong, rather than only discovering it on the first request.
    await this.pool.query("SELECT 1");
    this.logger.log("Database connection pool established");
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
    this.logger.log("Database connection pool closed");
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<T[]> {
    const result = await this.pool.query<T>(text, params);
    return result.rows;
  }
}
