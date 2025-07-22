/*
  Warnings:

  - You are about to drop the column `answerIndex` on the `GeneratedQuestion` table. All the data in the column will be lost.
  - You are about to drop the column `number` on the `GeneratedQuestion` table. All the data in the column will be lost.
  - Added the required column `correctAnswer` to the `GeneratedQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalQuestions` to the `GeneratedQuiz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GeneratedQuestion" DROP COLUMN "answerIndex",
DROP COLUMN "number",
ADD COLUMN     "correctAnswer" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "GeneratedQuiz" ADD COLUMN     "totalQuestions" INTEGER NOT NULL;
