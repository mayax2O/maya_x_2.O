import { Controller, Get } from "@nestjs/common";

import { HealthService, type DatabaseHealth } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("db")
  checkDatabase(): Promise<DatabaseHealth> {
    return this.healthService.checkDatabase();
  }
}
