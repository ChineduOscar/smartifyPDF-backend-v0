import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsString,
} from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  question: string;

  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsNumber()
  correct_answer: number;

  @IsString()
  explanation: string;
}

export class StoreQuizDto {
  @IsObject()
  document_info: {
    url: string;
    text_length: number;
    token_count: number;
  };

  @IsArray()
  questions: CreateQuestionDto[];
}
