import { Controller, Get } from "@nestjs/common";

// Deliberately a value import, not `import type`: NestJS's constructor
// injection relies on emitDecoratorMetadata capturing the real class
// reference at runtime (design:paramtypes). `import type` erases the
// import entirely, which breaks DI resolution — see the nest.cjs eslint
// override that disables consistent-type-imports for exactly this reason.
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getInfo() {
    return this.appService.getInfo();
  }

  @Get("health")
  getHealth() {
    return this.appService.getHealth();
  }
}
