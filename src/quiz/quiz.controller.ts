import {
  Body,
  Controller,
  Post,
  Param,
  Get,
  Query,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('store')
  async store(@Body() body: any) {
    return this.quizService.store(body);
  }

  @Get(':id')
  async getQuiz(@Param('id') id: string) {
    return this.quizService.getQuiz(id);
  }

  @Get(':id/download')
  async downloadQuizFile(
    @Param('id') quizId: string,
    @Query('format') format: 'pdf' | 'docx',
  ): Promise<StreamableFile> {
    const result = await this.quizService.generateQuizDownloadFile(
      quizId,
      format,
    );

    const shortId = quizId.slice(0, 8);
    const fileName = `smartfiyPDF_${shortId}.${format}`;

    if (format === 'pdf') {
      return new StreamableFile(result, {
        type: 'application/pdf',
        disposition: `attachment; filename="${fileName}"`,
      });
    }

    if (format === 'docx') {
      return new StreamableFile(result, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        disposition: `attachment; filename="${fileName}"`,
      });
    }
    throw new BadRequestException('Invalid format');
  }
}
