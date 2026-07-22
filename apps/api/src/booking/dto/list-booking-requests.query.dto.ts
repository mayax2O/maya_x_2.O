import { IsIn, IsOptional, IsUUID } from "class-validator";

import type { BookingStatus } from "@prisma/client";

import { ListQueryDto } from "../../common/dto/list-query.dto";

const STATUS_VALUES: BookingStatus[] = [
  "submitted",
  "under_review",
  "contacted",
  "confirmed",
  "declined",
  "expired",
  "cancelled",
];

/** GET /admin/booking-requests query params — the Agency review queue. */
export class ListBookingRequestsQueryDto extends ListQueryDto {
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: BookingStatus;

  @IsOptional()
  @IsUUID()
  talentId?: string;
}
