import { Global, Module } from "@nestjs/common";

import { DatabaseService } from "./database.service";

/**
 * Global so every future feature module can inject DatabaseService (and,
 * from M1B onward, PrismaService once it exists) without re-importing.
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
