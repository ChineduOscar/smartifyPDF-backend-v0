import { IsEmail, IsNotEmpty } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail()
  @IsNotEmpty()
  oldEmail: string;

  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}
