/*
  Warnings:

  - Added the required column `questionNumber` to the `GeneratedQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneratedQuestion" ADD COLUMN     "questionNumber" INTEGER NOT NULL;
