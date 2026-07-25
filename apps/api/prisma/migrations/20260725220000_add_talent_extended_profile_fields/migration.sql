-- Purely additive: nullable/defaulted columns on an existing table, no data loss risk.
ALTER TABLE "talents" ADD COLUMN "weight_kg" INTEGER;
ALTER TABLE "talents" ADD COLUMN "preferred_city_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
ALTER TABLE "talents" ADD COLUMN "available_outside" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "talents" ADD COLUMN "chest" TEXT;
ALTER TABLE "talents" ADD COLUMN "waist" TEXT;
ALTER TABLE "talents" ADD COLUMN "hip" TEXT;
ALTER TABLE "talents" ADD COLUMN "hair_length" TEXT;
