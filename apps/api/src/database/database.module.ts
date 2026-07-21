import { Global, Module } from "@nestjs/common";

import { DatabaseService } from "./database.service";
import { PrismaService } from "./prisma.service";

/**
 * Global so every feature module can inject DatabaseService and
 * PrismaService without re-importing.
 */
@Global()
@Module({
  providers: [DatabaseService, PrismaService],
  exports: [DatabaseService, PrismaService],
})
export class DatabaseModule {}
