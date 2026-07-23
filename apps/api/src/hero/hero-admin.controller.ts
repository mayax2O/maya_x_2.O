import {
  Body,
  Controller,
  Get,
  Patch,
  UseFilters,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { UpdateHeroSettingsDto } from "./dto/update-hero-settings.dto";
import { HeroService } from "./hero.service";
import type { HeroSettingsResponse } from "./hero.response";

interface DataEnvelope<T> {
  data: T;
}

@Controller("admin/hero")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminHeroController {
  constructor(private readonly heroService: HeroService) {}

  @Get()
  async getSettings(): Promise<DataEnvelope<HeroSettingsResponse>> {
    const data = await this.heroService.getSettings();
    return { data };
  }

  @Patch()
  async updateSettings(
    @Body() dto: UpdateHeroSettingsDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<HeroSettingsResponse>> {
    const data = await this.heroService.updateSettings(dto, user.sub);
    return { data };
  }
}
