import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

import type { BillingCycle } from "@prisma/client";

const BILLING_CYCLE_VALUES: BillingCycle[] = ["one_time", "monthly", "annual"];

export class CreateMembershipPlanDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  slug!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsIn(BILLING_CYCLE_VALUES)
  billingCycle!: BillingCycle;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
