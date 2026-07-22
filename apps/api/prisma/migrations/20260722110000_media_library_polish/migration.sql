-- Purely additive: nullable/empty-default columns only, plus one new index.
-- No data migration, no drops — safe to run against a populated production
-- table with zero downtime and trivially reversible (a rollback migration
-- would just DROP these same columns/index, no data loss either direction
-- since nothing existing depends on them yet).

-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN "ai_description" TEXT;
ALTER TABLE "media_assets" ADD COLUMN "ai_tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "media_assets" ADD COLUMN "dominant_color" TEXT;
ALTER TABLE "media_assets" ADD COLUMN "detected_objects" JSONB;
ALTER TABLE "media_assets" ADD COLUMN "detected_faces" JSONB;

-- CreateIndex
-- Supports the M6 polish pass's trash view (WHERE deleted_at IS NOT NULL)
-- and the existing "active only" queries (WHERE deleted_at IS NULL) that
-- every MediaService method already applies.
CREATE INDEX "media_assets_deleted_at_idx" ON "media_assets"("deleted_at");
