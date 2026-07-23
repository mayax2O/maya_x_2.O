-- Purely additive: nullable columns on an existing table, no data loss risk.
ALTER TABLE "talents" ADD COLUMN "nationality" TEXT;
ALTER TABLE "talents" ADD COLUMN "measurements" TEXT;
ALTER TABLE "talents" ADD COLUMN "dress_size" TEXT;
ALTER TABLE "talents" ADD COLUMN "hair_colour" TEXT;
ALTER TABLE "talents" ADD COLUMN "eye_colour" TEXT;
ALTER TABLE "talents" ADD COLUMN "general_availability" TEXT;
