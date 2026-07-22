-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('submitted', 'under_review', 'contacted', 'confirmed', 'declined', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "booking_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "talent_id" UUID NOT NULL,
    "guest_name" TEXT,
    "guest_email" TEXT,
    "guest_phone" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'submitted',
    "event_date" DATE,
    "event_details" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "booking_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_request_id" UUID NOT NULL,
    "admin_user_id" UUID,
    "previous_status" "BookingStatus",
    "new_status" "BookingStatus" NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_requests_talent_id_idx" ON "booking_requests"("talent_id");

-- CreateIndex
CREATE INDEX "booking_requests_user_id_idx" ON "booking_requests"("user_id");

-- CreateIndex
CREATE INDEX "booking_requests_status_idx" ON "booking_requests"("status");

-- CreateIndex
CREATE INDEX "booking_status_history_booking_request_id_idx" ON "booking_status_history"("booking_request_id");

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "talents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_booking_request_id_fkey" FOREIGN KEY ("booking_request_id") REFERENCES "booking_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_status_history" ADD CONSTRAINT "booking_status_history_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateCheckConstraint
-- Not expressible in the Prisma schema DSL: a booking request belongs to
-- either a registered User (Member) or carries guest contact details
-- (Guest), per docs/04-database §3.3 chk_booking_requester. Same pattern
-- as refresh_tokens_owner_check.
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_requester_check" CHECK (
    "user_id" IS NOT NULL OR ("guest_name" IS NOT NULL AND "guest_email" IS NOT NULL)
);
