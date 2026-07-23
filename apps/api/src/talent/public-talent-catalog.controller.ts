import { Controller, Get, Param, Query, UseFilters } from "@nestjs/common";

import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { ListPublicTalentCatalogQueryDto } from "./dto/list-public-talent-catalog.query.dto";
import { TalentService } from "./talent.service";
import type { TalentResponse } from "./talent.response";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

/**
 * Unauthenticated public Talent Catalog browse experience for apps/web
 * (listing, profile detail, city filter list) — separate from GET
 * /public/talent, which is a deliberately minimal booking-flow lookup used
 * elsewhere; left untouched so nothing that depends on it breaks.
 */
@Controller("public/talent-catalog")
@UseFilters(DomainHttpExceptionFilter)
export class PublicTalentCatalogController {
  constructor(private readonly talentService: TalentService) {}

  @Get()
  async findAll(
    @Query() query: ListPublicTalentCatalogQueryDto,
  ): Promise<ListEnvelope<TalentResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.talentService.findAllPublic(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Get("cities")
  async listCities(): Promise<DataEnvelope<string[]>> {
    const data = await this.talentService.listPublicCities();
    return { data };
  }

  @Get(":slug")
  async findBySlug(
    @Param("slug") slug: string,
  ): Promise<DataEnvelope<TalentResponse>> {
    const data = await this.talentService.findBySlugPublic(slug);
    return { data };
  }
}
