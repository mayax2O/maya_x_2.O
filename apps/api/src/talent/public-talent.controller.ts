import { Controller, Get, Query, UseFilters } from "@nestjs/common";

import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { PrismaService } from "../database/prisma.service";
import { ListPublicTalentQueryDto } from "./dto/list-public-talent.query.dto";
import {
  toPublicTalentResponse,
  type PublicTalentResponse,
} from "./public-talent.response";

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

const PUBLIC_TALENT_SELECT = {
  id: true,
  slug: true,
  displayName: true,
  tagline: true,
  city: { select: { name: true, state: true } },
} as const;

/**
 * Unauthenticated, minimal talent lookup — exists so the booking flows
 * (Quick Booking, registered-user booking) can resolve a real, active
 * talentId to submit a booking against. Not the full public Talent Catalog
 * browse endpoint from the REST API Specification §4.1 (that's a later
 * milestone); deliberately separate from the admin-only TalentController
 * so this never needs Roles("admin") or any auth guard.
 */
@Controller("public/talent")
@UseFilters(DomainHttpExceptionFilter)
export class PublicTalentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query() query: ListPublicTalentQueryDto,
  ): Promise<ListEnvelope<PublicTalentResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where = {
      deletedAt: null,
      isActive: true,
      ...(query.q
        ? { displayName: { contains: query.q, mode: "insensitive" as const } }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.talent.findMany({
        where,
        select: PUBLIC_TALENT_SELECT,
        orderBy: { displayName: "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.talent.count({ where }),
    ]);

    return {
      data: rows.map(toPublicTalentResponse),
      meta: { page, perPage, total },
    };
  }
}
