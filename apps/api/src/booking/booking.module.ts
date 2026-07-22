import { Module } from "@nestjs/common";

import { AdminBookingController } from "./admin-booking.controller";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";
import { MyBookingsController } from "./my-bookings.controller";

@Module({
  controllers: [
    BookingController,
    MyBookingsController,
    AdminBookingController,
  ],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
