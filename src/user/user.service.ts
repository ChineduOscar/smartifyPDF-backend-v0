import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Gender } from 'generated/prisma';
import { CompleteProfileDto, ChangeEmailDto } from 'src/dto';
import { MailerService } from 'src/mailer/mailer.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateCode } from 'src/utils';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    try {
      if (!userId) throw new BadRequestException('User ID is required');

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      if (!user.emailVerified)
        throw new ForbiddenException('Email not verified');

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...dto,
          gender: dto.gender?.toUpperCase() as Gender,
        },
      });

      const profileIsComplete =
        updatedUser.country !== null && updatedUser.targetLanguage !== null;

      if (profileIsComplete) {
        await this.mailerService.sendWelcomeEmail(
          updatedUser.email,
          updatedUser.firstName,
        );
      }

      const {
        password,
        verificationCode,
        verificationCodeExpires,
        ...cleanUser
      } = updatedUser;

      return cleanUser;
    } catch (error) {
      this.logger.error('completeProfile error:', error);

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        'Something went wrong while completing profile.',
      );
    }
  }

  async changeEmailAndResendCode(dto: ChangeEmailDto) {
    try {
      const { oldEmail, newEmail } = dto;

      if (!oldEmail) throw new BadRequestException('Old email is required.');
      if (!newEmail) throw new BadRequestException('New email is required.');

      const user = await this.prisma.user.findUnique({
        where: { email: oldEmail },
      });
      if (!user) throw new NotFoundException('Old email not found');
      if (user.emailVerified)
        throw new BadRequestException('Email already verified');

      const existing = await this.prisma.user.findUnique({
        where: { email: newEmail },
      });
      if (existing)
        throw new ConflictException(
          'An account with this email already exists.',
        );

      const newCode = generateCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: newEmail,
          verificationCode: newCode,
          verificationCodeExpires: expiry,
        },
      });

      await this.mailerService.sendVerificationCode(
        newEmail,
        updatedUser.firstName,
        newCode,
      );

      return {
        message: 'A verification code has been sent to your new email address.',
      };
    } catch (error) {
      this.logger.error('changeEmailAndResendCode error:', error);

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        'Something went wrong while changing your email.',
      );
    }
  }
}
