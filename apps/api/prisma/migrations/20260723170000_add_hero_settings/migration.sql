-- CreateEnum
CREATE TYPE "HeroMode" AS ENUM ('image', 'video', 'slider');

-- CreateTable
CREATE TABLE "hero_settings" (
    "id" UUID NOT NULL,
    "mode" "HeroMode" NOT NULL DEFAULT 'image',
    "media_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hero_settings_pkey" PRIMARY KEY ("id")
);
