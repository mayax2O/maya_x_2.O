import { Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import type {
  TalentAvailability,
  TalentVerificationStatus,
} from "@prisma/client";

const AVAILABILITY_VALUES: TalentAvailability[] = [
  "available",
  "limited",
  "unavailable",
];
const VERIFICATION_VALUES: TalentVerificationStatus[] = [
  "pending",
  "verified",
  "rejected",
];

export class CreateTalentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  displayName!: string;

  // Auto-derived from `displayName` (slugify) when omitted.
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  age?: number;

  @IsUUID()
  cityId!: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  bodyType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  basePrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  hourlyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  overnightRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  weekendRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  customPricingNotes?: string;

  @IsOptional()
  @IsIn(AVAILABILITY_VALUES)
  availability?: TalentAvailability;

  @IsOptional()
  @IsIn(VERIFICATION_VALUES)
  verificationStatus?: TalentVerificationStatus;

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID("4", { each: true })
  categoryIds?: string[];
}
