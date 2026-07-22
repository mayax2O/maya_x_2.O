import { IsIn, IsOptional } from "class-validator";

import type { BookingStatus } from "@prisma/client";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const STATUS_VALUES: BookingStatus[] = [
  "submitted",
  "under_review",
  "contacted",
  "confirmed",
  "declined",
  "expired",
  "cancelled",
];

/** GET /me/bookings query params — the authenticated customer's own requests. */
export class ListMyBookingsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: BookingStatus;
}
