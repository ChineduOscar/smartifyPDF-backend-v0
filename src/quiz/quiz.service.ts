import {
  Injectable,
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { StoreQuizDto, SubmitQuizDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const doc = new PDFDocument();
const stream = doc.pipe(new PassThrough());

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  async store(body: StoreQuizDto) {
    const {
      document_info: { url, text_length, token_count },
      questions,
    } = body;
    try {
      const document = await this.prisma.anonymousDocument.findUnique({
        where: { documentUrl: url },
      });

      if (!document) throw new NotFoundException('Document not found');

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
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        'An error occurred on our end while saving your document. please try again',
      );
    }
  }

  async getQuiz(quizId: string) {
    try {
      if (!quizId) throw new BadRequestException(`QuizId missing`);

      const quiz = await this.prisma.generatedQuiz.findUnique({
        where: { id: quizId },
        include: {
          document: true,
          questions: {
            orderBy: { questionNumber: 'asc' },
          },
        },
      });

      if (!quiz) {
        throw new NotFoundException(`Quiz with id ${quizId} not found`);
      }

      return quiz;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        'An error occurred on our end while saving your document. please try again',
      );
    }
  }

  async generateQuizDownloadFile(quizId: string, format: 'docx' | 'pdf') {
    const quiz = await this.prisma.generatedQuiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        document: true,
      },
    });

    if (!quiz) throw new NotFoundException('Quiz not found');

    const {
      document: { documentName },
      questions,
    } = quiz;

    switch (format) {
      case 'pdf': {
        const optionLetters = ['A', 'B', 'C', 'D'];

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text(`Document: ${documentName}\n\n`);

        doc.fontSize(14).font('Helvetica-Bold').text('QUESTIONS:\n');

        questions.forEach((q, i) => {
          doc
            .fontSize(12)
            .font('Helvetica')
            .text(`Q${i + 1}. ${q.question}`);

          q.options.forEach((option, idx) => {
            const letter = optionLetters[idx] || String.fromCharCode(65 + idx);
            doc.text(`  ${letter}. ${option}`);
          });

          doc.moveDown();
        });

        doc
          .moveDown()
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('ANSWERS & EXPLANATIONS:\n');

        questions.forEach((q, i) => {
          const correctLetter =
            optionLetters[q.correctAnswer] ||
            String.fromCharCode(65 + q.correctAnswer);
          const correctOption =
            q.options[q.correctAnswer] ?? '[Missing Option]';

          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`Q${i + 1}. Answer:`);
          doc.font('Helvetica').text(`  ${correctLetter}. ${correctOption}`);
          doc.text(
            `  Explanation: ${q.explanation || 'No explanation provided.'}`,
          );
          doc.moveDown();
        });

        doc.end();
        return stream;
      }

      case 'docx': {
        const optionLetters = ['A', 'B', 'C', 'D'];

        const doc = new Document({
          sections: [
            {
              properties: {},
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Document: ${documentName}`,
                      bold: true,
                      size: 28,
                    }),
                  ],
                  spacing: { after: 200 },
                }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'QUESTIONS:',
                      bold: true,
                      size: 26,
                    }),
                  ],
                  spacing: { after: 200 },
                }),

                ...questions.flatMap((q, i) => {
                  const questionParagraph = new Paragraph({
                    children: [
                      new TextRun({ text: `Q${i + 1}. ${q.question}` }),
                    ],
                    spacing: { after: 100 },
                  });

                  const optionParagraphs = q.options.map((option, idx) => {
                    const letter =
                      optionLetters[idx] || String.fromCharCode(65 + idx);
                    return new Paragraph({
                      children: [
                        new TextRun({ text: `   ${letter}. ${option}` }),
                      ],
                      spacing: { after: 50 },
                    });
                  });

                  return [questionParagraph, ...optionParagraphs];
                }),

                new Paragraph({ text: '', spacing: { after: 400 } }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: 'ANSWERS & EXPLANATIONS:',
                      bold: true,
                      size: 26,
                    }),
                  ],
                  spacing: { after: 200 },
                }),

                ...questions.flatMap((q, i) => {
                  const correctIndex = q.correctAnswer;
                  const correctLetter =
                    optionLetters[correctIndex] ||
                    String.fromCharCode(65 + correctIndex);
                  const correctOption =
                    q.options[correctIndex] ?? '[Missing Option]';

                  return [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Q${i + 1}. Answer:`,
                          bold: true,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `   ${correctLetter}. ${correctOption}`,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `   Explanation: ${q.explanation || 'No explanation provided.'}`,
                        }),
                      ],
                      spacing: { after: 300 },
                    }),
                  ];
                }),
              ],
            },
          ],
        });

        const buffer = await Packer.toBuffer(doc);
        return buffer;
      }

      default:
        throw new BadRequestException('Unsupported file format');
    }
  }
  async storeQuizResult(dto: SubmitQuizDto) {
    try {
      const total = dto.answers.length;

      let correct = 0;

      const questions = dto.answers.map((ans) => {
        const isCorrect = ans.selectedOptionIndex === ans.correctOptionIndex;
        if (isCorrect) correct++;

        return {
          questionId: ans.questionId,
          isCorrect,
          selectedOptionIndex: ans.selectedOptionIndex,
          correctOptionIndex: ans.correctOptionIndex,
        };
      });

      const percentage = Math.round((correct / total) * 100);

      const result = await this.prisma.quizResult.create({
        data: {
          quizId: dto.quizId,
          mode: dto.mode,
          score: correct,
          percentage,
          totalQuestions: total,
          correctAnswers: correct,
          incorrectAnswers: total - correct,
          questions,
        },
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        'An error occurred on our end. Please try again.',
      );
    }
  }

  async getQuizResults(quizId: string, mode?: 'study' | 'exam') {
    const result = await this.prisma.quizResult.findFirst({
      where: {
        quizId,
        ...(mode ? { mode } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!result) {
      throw new NotFoundException('Quiz result not found');
    }

    return result;
  }
}
