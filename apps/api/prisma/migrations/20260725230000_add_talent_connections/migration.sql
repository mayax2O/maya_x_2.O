-- Purely additive: nullable columns on an existing table, no data loss risk.
ALTER TABLE "talents" ADD COLUMN "mobile" TEXT;
ALTER TABLE "talents" ADD COLUMN "mobile_2" TEXT;
ALTER TABLE "talents" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "talents" ADD COLUMN "telegram" TEXT;
ALTER TABLE "talents" ADD COLUMN "other_contact" TEXT;
