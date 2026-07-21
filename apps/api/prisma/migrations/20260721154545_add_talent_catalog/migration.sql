-- CreateEnum
CREATE TYPE "TalentAvailability" AS ENUM ('available', 'limited', 'unavailable');

-- CreateEnum
CREATE TYPE "TalentVerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "city_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "talent_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_category_map" (
    "talent_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,

    CONSTRAINT "talent_category_map_pkey" PRIMARY KEY ("talent_id","category_id")
);

-- CreateTable
CREATE TABLE "talents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "display_name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "bio" TEXT,
    "age" INTEGER,
    "city_id" UUID NOT NULL,
    "location_id" UUID,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "height_cm" INTEGER,
    "body_type" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "base_price" DECIMAL(10,2) NOT NULL,
    "hourly_rate" DECIMAL(10,2),
    "overnight_rate" DECIMAL(10,2),
    "weekend_rate" DECIMAL(10,2),
    "custom_pricing_notes" TEXT,
    "availability" "TalentAvailability" NOT NULL DEFAULT 'available',
    "verification_status" "TalentVerificationStatus" NOT NULL DEFAULT 'pending',
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "talents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_media" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "talent_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL DEFAULT 'image',
    "cloudinary_public_id" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "talent_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_state_key" ON "cities"("name", "state");

-- CreateIndex
CREATE UNIQUE INDEX "locations_city_id_name_key" ON "locations"("city_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "talent_categories_slug_key" ON "talent_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "talents_slug_key" ON "talents"("slug");

-- CreateIndex
CREATE INDEX "talent_media_talent_id_idx" ON "talent_media"("talent_id");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_category_map" ADD CONSTRAINT "talent_category_map_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_category_map" ADD CONSTRAINT "talent_category_map_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "talent_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talents" ADD CONSTRAINT "talents_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talents" ADD CONSTRAINT "talents_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_media" ADD CONSTRAINT "talent_media_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
