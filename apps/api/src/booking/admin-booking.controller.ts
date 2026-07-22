import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseFilters,
  UseGuards,
} from "@nestjs/common";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import type { BookingResponse } from "./booking-request.response";
import { BookingService } from "./booking.service";
import { ListBookingRequestsQueryDto } from "./dto/list-booking-requests.query.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";

interface DataEnvelope<T> {
  data: T;
}

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("admin/booking-requests")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminBookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  async findAll(
    @Query() query: ListBookingRequestsQueryDto,
  ): Promise<ListEnvelope<BookingResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.bookingService.findAllForAdmin(query);
    return { data: items, meta: { page, perPage, total } };
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<BookingResponse>> {
    const data = await this.bookingService.updateStatus(id, dto, user.sub);
    return { data };
  }
}
