import type {
  BookingRequest,
  BookingStatus,
  BookingStatusHistory,
  Talent,
  User,
} from "@prisma/client";

export type BookingRequestWithRelations = BookingRequest & {
  talent: Pick<Talent, "id" | "slug" | "displayName">;
  user: Pick<User, "id" | "fullName" | "email" | "phone"> | null;
  statusHistory?: BookingStatusHistory[];
};

export interface BookingCustomerSummary {
  type: "guest" | "member";
  name: string;
  email: string;
  phone: string | null;
}

export interface BookingStatusHistoryItem {
  id: string;
  previousStatus: BookingStatus | null;
  newStatus: BookingStatus;
  notes: string | null;
  createdAt: Date;
}

export interface BookingResponse {
  id: string;
  status: BookingStatus;
  talent: { id: string; slug: string; displayName: string };
  customer: BookingCustomerSummary;
  eventDate: Date | null;
  eventDetails: string | null;
  createdAt: Date;
  updatedAt: Date;
  statusHistory?: BookingStatusHistoryItem[];
}

function toCustomerSummary(
  booking: BookingRequestWithRelations,
): BookingCustomerSummary {
  if (booking.user) {
    return {
      type: "member",
      name: booking.user.fullName,
      email: booking.user.email,
      phone: booking.user.phone,
    };
  }
  return {
    type: "guest",
    // Only reachable when userId is null, in which case the requester
    // CHECK constraint (chk_booking_requester) guarantees these are set.
    name: booking.guestName as string,
    email: booking.guestEmail as string,
    phone: booking.guestPhone,
  };
}

export function toBookingResponse(
  booking: BookingRequestWithRelations,
): BookingResponse {
  return {
    id: booking.id,
    status: booking.status,
    talent: {
      id: booking.talent.id,
      slug: booking.talent.slug,
      displayName: booking.talent.displayName,
    },
    customer: toCustomerSummary(booking),
    eventDate: booking.eventDate,
    eventDetails: booking.eventDetails,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    ...(booking.statusHistory
      ? {
          statusHistory: booking.statusHistory
            .slice()
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .map((entry) => ({
              id: entry.id,
              previousStatus: entry.previousStatus,
              newStatus: entry.newStatus,
              notes: entry.notes,
              createdAt: entry.createdAt,
            })),
        }
      : {}),
  };
}
