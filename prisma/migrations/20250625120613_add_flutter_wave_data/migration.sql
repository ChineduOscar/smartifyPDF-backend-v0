/*
  Warnings:

  - You are about to drop the column `metadata` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "metadata",
ADD COLUMN     "flutterWavData" JSONB;
