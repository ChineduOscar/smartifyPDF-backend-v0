import { Injectable, BadRequestException } from '@nestjs/common';
import { StoreQuizDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async store(body: StoreQuizDto) {
    const {
      document_info: { url, text_length, token_count },
      questions,
    } = body;

    const document = await this.prisma.anonymousDocument.findUnique({
      where: { documentUrl: url },
    });

    if (!document) throw new BadRequestException('Document not found');

    await this.prisma.anonymousDocument.update({
      where: { documentUrl: url },
      data: {
        textLength: text_length,
        tokenCount: token_count,
      },
    });

    const quiz = await this.prisma.generatedQuiz.create({
      data: {
        documentId: document.id,
        totalQuestions: questions.length,
      },
    });

    await this.prisma.generatedQuestion.createMany({
      data: questions.map((q, i) => ({
        quizId: quiz.id,
        question: q.question,
        questionNumber: i + 1,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        options: q.options,
      })),
    });

    const fullQUiz = await this.prisma.generatedQuiz.findUnique({
      where: { id: quiz.id },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
        },
      },
    });

    return fullQUiz;
  }
}
