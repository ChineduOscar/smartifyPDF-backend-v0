import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class CreateTeacherApplicationDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  languagesSpoken: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  languagesTaught: string[];

  @IsString()
  @IsNotEmpty()
  experience: string;

  @IsString()
  @IsNotEmpty()
  bio: string;

  @IsString()
  @IsNotEmpty()
  whyTeachWithUs: string;
}
