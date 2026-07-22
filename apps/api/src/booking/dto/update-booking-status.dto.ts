import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

import type { BookingStatus } from "@prisma/client";

const STATUS_VALUES: BookingStatus[] = [
  "submitted",
  "under_review",
  "contacted",
  "confirmed",
  "declined",
  "expired",
  "cancelled",
];

export class UpdateBookingStatusDto {
  @IsIn(STATUS_VALUES)
  newStatus!: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
