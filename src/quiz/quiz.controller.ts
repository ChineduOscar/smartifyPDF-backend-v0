import { Body, Controller, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('store')
  async store(@Body() body: any) {
    return this.quizService.store(body);
  }
}
