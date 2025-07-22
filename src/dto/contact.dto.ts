import { IsEmail, IsNotEmpty } from 'class-validator';

export class ContactDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  message: string;
}
