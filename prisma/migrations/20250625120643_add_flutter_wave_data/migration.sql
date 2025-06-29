/*
  Warnings:

  - You are about to drop the column `flutterWavData` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "flutterWavData",
ADD COLUMN     "flutterwaveData" JSONB;
