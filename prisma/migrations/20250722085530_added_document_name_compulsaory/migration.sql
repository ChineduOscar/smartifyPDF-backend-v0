/*
  Warnings:

  - Made the column `documentName` on table `AnonymousDocument` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AnonymousDocument" ALTER COLUMN "documentName" SET NOT NULL;
