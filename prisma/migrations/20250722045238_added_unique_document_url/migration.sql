/*
  Warnings:

  - A unique constraint covering the columns `[documentUrl]` on the table `AnonymousDocument` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AnonymousDocument_documentUrl_key" ON "AnonymousDocument"("documentUrl");
