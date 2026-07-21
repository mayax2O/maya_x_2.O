import { Controller, Get, UseFilters, UseGuards } from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { DashboardService } from "./dashboard.service";
import type { DashboardStatsResponse } from "./dashboard.response";

interface DataEnvelope<T> {
  data: T;
}

@Controller("dashboard")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getStats(): Promise<DataEnvelope<DashboardStatsResponse>> {
    const data = await this.dashboardService.getStats();
    return { data };
  }
}
