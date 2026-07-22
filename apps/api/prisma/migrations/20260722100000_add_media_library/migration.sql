-- CreateTable
CREATE TABLE "media_folders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "media_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "folder_id" UUID,
    "public_id" TEXT,
    "url" TEXT NOT NULL,
    "format" TEXT,
    "resource_type" TEXT NOT NULL DEFAULT 'image',
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "content_hash" TEXT,
    "original_filename" TEXT,
    "alt_text" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'cloudinary',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_usages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "media_asset_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_folders_slug_key" ON "media_folders"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_public_id_key" ON "media_assets"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_content_hash_key" ON "media_assets"("content_hash");

-- CreateIndex
CREATE INDEX "media_assets_folder_id_idx" ON "media_assets"("folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_usages_media_asset_id_entity_type_entity_id_key" ON "media_usages"("media_asset_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "media_usages_entity_type_entity_id_idx" ON "media_usages"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "media_folders" ADD CONSTRAINT "media_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "media_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_usages" ADD CONSTRAINT "media_usages_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate TalentMedia (M4) from url/alt columns to a MediaAsset reference.
--
-- AddColumn (nullable first — backfilled below, then made NOT NULL)
ALTER TABLE "talent_media" ADD COLUMN "media_asset_id" UUID;

-- DataMigration
-- One legacy MediaAsset per existing TalentMedia row, preserving its url/alt
-- exactly (source = 'legacy' — never uploaded to Cloudinary, no public_id/
-- content_hash). A DO block is used instead of a single INSERT...SELECT so
-- each new media_assets row is tied back to the exact talent_media row it
-- came from, without relying on url/alt/created_at being unique enough to
-- join on afterwards.
DO $$
DECLARE
  r RECORD;
  new_asset_id UUID;
BEGIN
  FOR r IN SELECT "id", "talent_id", "url", "alt", "asset_type", "created_at" FROM "talent_media" LOOP
    new_asset_id := gen_random_uuid();

    INSERT INTO "media_assets" ("id", "url", "alt_text", "resource_type", "source", "created_at", "updated_at")
    VALUES (new_asset_id, r."url", r."alt", COALESCE(r."asset_type", 'image'), 'legacy', r."created_at", r."created_at");

    UPDATE "talent_media" SET "media_asset_id" = new_asset_id WHERE "id" = r."id";

    INSERT INTO "media_usages" ("media_asset_id", "entity_type", "entity_id", "created_at")
    VALUES (new_asset_id, 'talent_gallery', r."talent_id", r."created_at");
  END LOOP;
END $$;

-- AlterColumn (now that every row has been backfilled)
ALTER TABLE "talent_media" ALTER COLUMN "media_asset_id" SET NOT NULL;

-- DropColumn
ALTER TABLE "talent_media" DROP COLUMN "url";
ALTER TABLE "talent_media" DROP COLUMN "alt";
ALTER TABLE "talent_media" DROP COLUMN "asset_type";
ALTER TABLE "talent_media" DROP COLUMN "cloudinary_public_id";

-- AddForeignKey
ALTER TABLE "talent_media" ADD CONSTRAINT "talent_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "talent_media_media_asset_id_idx" ON "talent_media"("media_asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "talent_media_talent_id_media_asset_id_key" ON "talent_media"("talent_id", "media_asset_id");
