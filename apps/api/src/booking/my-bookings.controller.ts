import { Controller, Get, Query, UseFilters, UseGuards } from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import type { BookingResponse } from "./booking-request.response";
import { BookingService } from "./booking.service";
import { ListMyBookingsQueryDto } from "./dto/list-my-bookings.query.dto";

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

// Separate controller (rather than folding into BookingController) so the
// "me" path segment reads naturally — GET /api/v1/me/bookings, matching
// the existing GET /api/v1/auth/me convention for the authenticated
// customer's own resources.
@Controller("me/bookings")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard)
export class MyBookingsController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  async findAll(
    @Query() query: ListMyBookingsQueryDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ListEnvelope<BookingResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.bookingService.findAllForUser(
      user.sub,
      query,
    );
    return { data: items, meta: { page, perPage, total } };
  }
}
