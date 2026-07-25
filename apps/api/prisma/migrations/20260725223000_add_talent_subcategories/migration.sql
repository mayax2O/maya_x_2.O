-- CreateTable
CREATE TABLE "talent_subcategories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "talent_subcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "talent_subcategory_map" (
    "talent_id" UUID NOT NULL,
    "subcategory_id" UUID NOT NULL,

    CONSTRAINT "talent_subcategory_map_pkey" PRIMARY KEY ("talent_id","subcategory_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "talent_subcategories_slug_key" ON "talent_subcategories"("slug");

-- AddForeignKey
ALTER TABLE "talent_subcategories" ADD CONSTRAINT "talent_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "talent_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_subcategory_map" ADD CONSTRAINT "talent_subcategory_map_talent_id_fkey" FOREIGN KEY ("talent_id") REFERENCES "talents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "talent_subcategory_map" ADD CONSTRAINT "talent_subcategory_map_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "talent_subcategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
