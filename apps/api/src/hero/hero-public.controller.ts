import { Controller, Get, UseFilters } from "@nestjs/common";

import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { HeroService } from "./hero.service";
import type { HeroSettingsResponse } from "./hero.response";

interface DataEnvelope<T> {
  data: T;
}

/**
 * Unauthenticated — the public site's home page reads this on every render
 * to know what to show as its Hero background.
 */
@Controller("public/hero")
@UseFilters(DomainHttpExceptionFilter)
export class PublicHeroController {
  constructor(private readonly heroService: HeroService) {}

  @Get()
  async getSettings(): Promise<DataEnvelope<HeroSettingsResponse>> {
    const data = await this.heroService.getSettings();
    return { data };
  }
}
