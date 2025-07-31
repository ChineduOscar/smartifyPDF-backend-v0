// dto/submit-quiz.dto.ts
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsString()
  questionId: string;

  @IsNumber()
  selectedOptionIndex: number;

  @IsNumber()
  correctOptionIndex: number;
}

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  quizId: string;

  @IsEnum(['study', 'exam'])
  mode: 'study' | 'exam';

  @IsNumber()
  totalQuestions: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
