import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Prisma's generated client, lifecycle-managed the same way as
 * DatabaseService (connects on boot, closes cleanly on shutdown). This is
 * the query layer for models added from M1B onward (Admin, User, ...);
 * DatabaseService's raw `pg` pool remains for the low-level connectivity
 * check in HealthService, which predates any Prisma model existing.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Prisma client connected");
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log("Prisma client disconnected");
  }
}
