import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";

import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import type { BookingResponse } from "./booking-request.response";
import { BookingService } from "./booking.service";
import { CreateBookingRequestDto } from "./dto/create-booking-request.dto";

interface DataEnvelope<T> {
  data: T;
}

// REST API Specification §5 rate-limits submission per-IP to mitigate spam;
// tighter than the app-wide default (see AuthController for the same
// pattern on login/register).
const BOOKING_SUBMIT_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@Controller("booking-requests")
@UseFilters(DomainHttpExceptionFilter)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle(BOOKING_SUBMIT_THROTTLE)
  async create(
    @Body() dto: CreateBookingRequestDto,
    @CurrentUser() user: AccessTokenPayload | undefined,
  ): Promise<DataEnvelope<BookingResponse>> {
    const data = await this.bookingService.create(dto, user);
    return { data };
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<DataEnvelope<BookingResponse>> {
    const data = await this.bookingService.findOne(id, user);
    return { data };
  }
}
