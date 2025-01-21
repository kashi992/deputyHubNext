/*
  Warnings:

  - You are about to drop the column `userId` on the `ContactMedia` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContactMedia" DROP CONSTRAINT "ContactMedia_userId_fkey";

-- DropIndex
DROP INDEX "IX_ContactMedia_userId";

-- AlterTable
ALTER TABLE "ContactMedia" DROP COLUMN "userId";
