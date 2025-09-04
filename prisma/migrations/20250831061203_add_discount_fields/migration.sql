-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tagline" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "price" REAL NOT NULL,
    "images" TEXT NOT NULL DEFAULT '[]',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "sellerId" TEXT NOT NULL,
    "originalPrice" REAL,
    "discountPercent" REAL,
    "discountAmount" REAL,
    "discountStart" DATETIME,
    "discountEnd" DATETIME,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "material" TEXT,
    "technique" TEXT,
    "artForm" TEXT,
    "origin" TEXT,
    "length" REAL,
    "width" REAL,
    "height" REAL,
    "weight" REAL,
    "artisanStory" TEXT,
    "culturalSignificance" TEXT,
    "timeToCreate" INTEGER,
    "isCustomizable" BOOLEAN NOT NULL DEFAULT false,
    "careInstructions" TEXT,
    "authenticityMark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_products" ("artForm", "artisanStory", "authenticityMark", "careInstructions", "createdAt", "culturalSignificance", "description", "height", "id", "images", "inStock", "isCustomizable", "length", "material", "origin", "price", "sellerId", "stockQuantity", "tagline", "tags", "technique", "timeToCreate", "title", "updatedAt", "weight", "width") SELECT "artForm", "artisanStory", "authenticityMark", "careInstructions", "createdAt", "culturalSignificance", "description", "height", "id", "images", "inStock", "isCustomizable", "length", "material", "origin", "price", "sellerId", "stockQuantity", "tagline", "tags", "technique", "timeToCreate", "title", "updatedAt", "weight", "width" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
