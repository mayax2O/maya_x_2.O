import { IsIn, IsOptional, IsUUID } from "class-validator";

import type { PaymentStatus } from "@prisma/client";

import { PaginationQueryDto } from "../../common/dto/pagination-query.dto";

const STATUS_VALUES: PaymentStatus[] = [
  "created",
  "authorized",
  "captured",
  "failed",
  "refunded",
];

/** GET /admin/payments query params — reconciliation view. */
export class ListAdminPaymentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: PaymentStatus;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
