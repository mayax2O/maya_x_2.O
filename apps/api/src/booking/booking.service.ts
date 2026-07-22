import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { BookingStatus, Prisma } from "@prisma/client";

import type { AccessTokenPayload } from "../auth/jwt-payload.interface";
import { PrismaService } from "../database/prisma.service";
import type { PaginatedResult } from "../common/pagination-result.interface";
import {
  toBookingResponse,
  type BookingRequestWithRelations,
  type BookingResponse,
} from "./booking-request.response";
import type { CreateBookingRequestDto } from "./dto/create-booking-request.dto";
import type { ListBookingRequestsQueryDto } from "./dto/list-booking-requests.query.dto";
import type { ListMyBookingsQueryDto } from "./dto/list-my-bookings.query.dto";
import type { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";

const BOOKING_INCLUDE = {
  talent: { select: { id: true, slug: true, displayName: true } },
  user: { select: { id: true, fullName: true, email: true, phone: true } },
} satisfies Prisma.BookingRequestInclude;

const BOOKING_INCLUDE_WITH_HISTORY = {
  ...BOOKING_INCLUDE,
  statusHistory: true,
} satisfies Prisma.BookingRequestInclude;

/**
 * Legal status transitions per Enterprise Architecture §7.1's state
 * machine. Anything not listed as a value for the current status is
 * rejected with 409 Conflict — e.g. Confirmed -> Submitted.
 */
const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  submitted: ["under_review", "declined", "expired"],
  under_review: ["contacted", "declined", "expired"],
  contacted: ["confirmed", "declined"],
  confirmed: ["cancelled"],
  declined: [],
  expired: [],
  cancelled: [],
};

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateBookingRequestDto,
    currentUser?: AccessTokenPayload,
  ): Promise<BookingResponse> {
    const isMember = Boolean(currentUser && currentUser.type === "user");

    if (!isMember && (!dto.guestName || !dto.guestEmail)) {
      throw new BadRequestException({
        code: "GUEST_CONTACT_REQUIRED",
        message: "guestName and guestEmail are required when not signed in.",
      });
    }

    const talent = await this.prisma.talent.findFirst({
      where: { id: dto.talentId, deletedAt: null, isActive: true },
    });
    if (!talent) {
      throw new NotFoundException({
        code: "TALENT_NOT_FOUND",
        message: "Talent not found.",
      });
    }

    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.bookingRequest.create({
        data: {
          talentId: dto.talentId,
          userId: isMember ? currentUser!.sub : undefined,
          guestName: isMember ? undefined : dto.guestName,
          guestEmail: isMember ? undefined : dto.guestEmail,
          guestPhone: isMember ? undefined : dto.guestPhone,
          eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
          eventDetails: dto.eventDetails,
        },
        include: BOOKING_INCLUDE,
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingRequestId: created.id,
          previousStatus: null,
          newStatus: created.status,
        },
      });
      return created;
    });

    return toBookingResponse(booking);
  }

  async findOne(
    id: string,
    currentUser: AccessTokenPayload,
  ): Promise<BookingResponse> {
    const booking = await this.findBookingOrThrow(
      id,
      BOOKING_INCLUDE_WITH_HISTORY,
    );

    const isAdmin = currentUser.type === "admin";
    const isOwner =
      currentUser.type === "user" && booking.userId === currentUser.sub;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "You do not have permission to view this booking request.",
      });
    }

    return toBookingResponse(booking);
  }

  async findAllForUser(
    userId: string,
    query: ListMyBookingsQueryDto,
  ): Promise<PaginatedResult<BookingResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.BookingRequestWhereInput = {
      userId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.bookingRequest.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.bookingRequest.count({ where }),
    ]);

    return { items: rows.map(toBookingResponse), total };
  }

  async findAllForAdmin(
    query: ListBookingRequestsQueryDto,
  ): Promise<PaginatedResult<BookingResponse>> {
    const page = query.page ?? 1;
    const perPage = query.perPage ?? 20;

    const where: Prisma.BookingRequestWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.talentId ? { talentId: query.talentId } : {}),
      ...(query.q
        ? {
            OR: [
              { guestName: { contains: query.q, mode: "insensitive" } },
              { guestEmail: { contains: query.q, mode: "insensitive" } },
              {
                user: {
                  is: {
                    OR: [
                      { fullName: { contains: query.q, mode: "insensitive" } },
                      { email: { contains: query.q, mode: "insensitive" } },
                    ],
                  },
                },
              },
              {
                talent: {
                  is: {
                    displayName: { contains: query.q, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.bookingRequest.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { createdAt: query.sortOrder ?? "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.bookingRequest.count({ where }),
    ]);

    return { items: rows.map(toBookingResponse), total };
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    adminId: string,
  ): Promise<BookingResponse> {
    const booking = await this.findBookingOrThrow(id, BOOKING_INCLUDE);

    const allowedNext = STATUS_TRANSITIONS[booking.status];
    if (!allowedNext.includes(dto.newStatus)) {
      throw new ConflictException({
        code: "INVALID_STATUS_TRANSITION",
        message: `Cannot transition a booking request from "${booking.status}" to "${dto.newStatus}".`,
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.bookingRequest.update({
        where: { id },
        data: { status: dto.newStatus },
        include: BOOKING_INCLUDE,
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingRequestId: id,
          adminUserId: adminId,
          previousStatus: booking.status,
          newStatus: dto.newStatus,
          notes: dto.notes,
        },
      });
      return result;
    });

    return toBookingResponse(updated);
  }

  private async findBookingOrThrow(
    id: string,
    include: Prisma.BookingRequestInclude,
  ): Promise<BookingRequestWithRelations> {
    const booking = await this.prisma.bookingRequest.findFirst({
      where: { id, deletedAt: null },
      include,
    });
    if (!booking) {
      throw new NotFoundException({
        code: "BOOKING_NOT_FOUND",
        message: "Booking request not found.",
      });
    }
    return booking as BookingRequestWithRelations;
  }
}
