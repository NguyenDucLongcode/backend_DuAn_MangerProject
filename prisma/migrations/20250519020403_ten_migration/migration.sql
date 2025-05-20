/*
  Warnings:

  - You are about to drop the column `image` on the `GroupDev` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "GroupDev" DROP COLUMN "image",
ADD COLUMN     "avatar_public_id" TEXT,
ADD COLUMN     "avatar_url" TEXT;
