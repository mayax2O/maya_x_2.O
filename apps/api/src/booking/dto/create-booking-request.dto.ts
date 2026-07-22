import { Type } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateBookingRequestDto {
  @IsUUID()
  talentId!: string;

  @IsOptional()
  @Type(() => String)
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  eventDetails?: string;

  // Required only when the caller is unauthenticated (Guest) — enforced in
  // BookingService, not here, since the requirement depends on whether a
  // bearer token was presented, which class-validator can't see.
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  guestName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  guestEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  guestPhone?: string;
}
