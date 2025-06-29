import { IsOptional, IsEnum, IsString } from 'class-validator';
import { Gender } from '@prisma/client';

export class CompleteProfileDto {
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  ageRange?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  targetLanguage?: string;

  @IsOptional()
  @IsString()
  reasonForLearning?: string;
}
