-- AlterTable
ALTER TABLE "AnonymousDocument" ADD COLUMN     "textLength" INTEGER,
ADD COLUMN     "tokenCount" INTEGER;

-- CreateTable
CREATE TABLE "GeneratedQuiz" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "answerIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,

    CONSTRAINT "GeneratedQuestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GeneratedQuiz" ADD CONSTRAINT "GeneratedQuiz_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AnonymousDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedQuestion" ADD CONSTRAINT "GeneratedQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "GeneratedQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
