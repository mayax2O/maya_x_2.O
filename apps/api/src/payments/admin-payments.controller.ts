import { Controller, Get, Query, UseFilters, UseGuards } from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { DomainHttpExceptionFilter } from "../common/filters/domain-http-exception.filter";
import { ListAdminPaymentsQueryDto } from "./dto/list-admin-payments.query.dto";
import type { AdminPaymentResponse } from "./payment.response";
import { PaymentsService } from "./payments.service";

interface ListEnvelope<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number };
}

@Controller("admin/payments")
@UseFilters(DomainHttpExceptionFilter)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin")
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(
    @Query() query: ListAdminPaymentsQueryDto,
  ): Promise<ListEnvelope<AdminPaymentResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;
    const { items, total } = await this.paymentsService.findAllForAdmin(query);
    return { data: items, meta: { page, perPage, total } };
  }
}
