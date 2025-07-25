-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "images" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "moderationNote" TEXT,
    "isBoosted" BOOLEAN NOT NULL DEFAULT false,
    "boostLevel" TEXT,
    "boostExpiry" DATETIME,
    "clickValue" REAL,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pay_per_view_rate" DECIMAL NOT NULL DEFAULT 0.00,
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "rejection_reason" TEXT,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("authorId", "boostExpiry", "boostLevel", "clickValue", "content", "createdAt", "id", "images", "isBoosted", "moderationNote", "publishedAt", "status", "title", "updatedAt") SELECT "authorId", "boostExpiry", "boostLevel", "clickValue", "content", "createdAt", "id", "images", "isBoosted", "moderationNote", "publishedAt", "status", "title", "updatedAt" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
