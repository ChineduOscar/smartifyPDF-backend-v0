import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from 'src/dto';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { MailerService } from 'src/mailer/mailer.service';
import { generateCode } from 'src/utils';
import { nanoid } from 'nanoid';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (userExists) throw new ForbiddenException('Email already in use');

      const verificationCode = generateCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      const hash = await argon.hash(dto.password);
      const user = await this.prisma.user.create({
        data: {
          ...dto,
          password: hash,
          verificationCode,
          verificationCodeExpires: expiry,
        },
      });

      await this.mailerService.sendVerificationCode(
        user.email,
        user.firstName,
        verificationCode,
      );

      const {
        password,
        verificationCode: _,
        verificationCodeExpires: __,
        ...safeUser
      } = user;

      return {
        message: 'A verification code has been sent to your email address.',
        user: safeUser,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async resendCode(email: string) {
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) throw new NotFoundException('User not found');

      if (user.emailVerified)
        throw new BadRequestException('Email already verified');

      const newCode = generateCode();
      const newExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await this.prisma.user.update({
        where: { email },
        data: {
          verificationCode: newCode,
          verificationCodeExpires: newExpiry,
        },
      });

      await this.mailerService.sendVerificationCode(
        user.email,
        user.firstName,
        newCode,
      );

      return {
        message: 'A new verification code has been sent to your email address.',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async verifyCode(email: string, code: string) {
    try {
      if (!email) throw new BadRequestException('Email is required');

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) throw new NotFoundException('User not found');

      if (user.emailVerified)
        throw new BadRequestException('Email already verified');

      if (user.verificationCode !== code)
        throw new BadRequestException('Invalid verification code');

      if (
        !user.verificationCodeExpires ||
        user.verificationCodeExpires < new Date()
      ) {
        throw new ForbiddenException('Verification code has expired');
      }

      const updatedUser = await this.prisma.user.update({
        where: { email },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationCodeExpires: null,
        },
      });

      const tokens = await this.generateTokenPair(
        updatedUser.id,
        updatedUser.email,
        updatedUser.role,
      );
      const freePlan = await this.prisma.plan.findFirst({
        where: { title: 'Free Plan' },
      });

      if (freePlan) {
        await this.prisma.userPlan.upsert({
          where: { userId: updatedUser.id },
          update: {
            planId: freePlan.id,
          },
          create: {
            userId: updatedUser.id,
            planId: freePlan.id,
          },
        });
      }

      const {
        password,
        verificationCode,
        verificationCodeExpires,
        ...safeUser
      } = updatedUser;

      return {
        message: 'Email verified successfully',
        ...tokens,
        user: safeUser,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      ("Oops! Something broke, but it's not your fault. Give it another go.");
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      if (!user.emailVerified) {
        throw new ForbiddenException('Please verify your email to log in.');
      }

      const pwMatches = await argon.verify(user.password, dto.password);
      if (!pwMatches) {
        throw new ForbiddenException('Invalid credentials');
      }

      const profileIsComplete = user.country && user.targetLanguage;
      if (!profileIsComplete) {
        throw new ForbiddenException(
          'Please complete your profile before logging in.',
        );
      }

      const {
        password,
        verificationCode,
        verificationCodeExpires,
        ...safeUser
      } = user;

      const tokens = await this.generateTokenPair(
        user.id,
        user.email,
        user.role,
      );

      return {
        ...tokens,
        user: safeUser,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      if (!refreshToken)
        throw new UnauthorizedException('Refresh token is required');

      let decoded: { sub: string; email: string; role: string };
      try {
        decoded = await this.jwt.verifyAsync(refreshToken, {
          secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        });
      } catch (err) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord)
        throw new UnauthorizedException('Invalid refresh token');

      if (decoded.sub !== tokenRecord.userId)
        throw new UnauthorizedException('Token does not belong to this user');

      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      const tokens = await this.generateTokenPair(
        tokenRecord.user.id,
        tokenRecord.user.email,
        tokenRecord.user.role,
      );

      return tokens;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async logout(refreshToken: string) {
    try {
      if (!refreshToken)
        throw new BadRequestException('Refresh token is required');

      try {
        await this.prisma.refreshToken.delete({
          where: { token: refreshToken },
        });
      } catch (err) {
        if (err instanceof HttpException) {
          throw err;
        }
        throw new NotFoundException(
          'Refresh token not found or already logged out',
        );
      }

      return { message: 'Logged out successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async forgotPassword(email: string) {
    try {
      if (!email) throw new BadRequestException('Email is required');

      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) throw new NotFoundException('User not found');

      const frontendUrl = this.config.get<string>('FRONTEND_URL');

      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      const resetLink = `${frontendUrl}/reset-password?token=${token}`;
      await this.mailerService.sendResetPasswordEmail(user.email, resetLink);

      return { message: 'Password reset link sent' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      if (!token) throw new BadRequestException('Token is required');
      if (!newPassword) throw new BadRequestException('Password is required');

      const resetRecord = await this.prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetRecord)
        throw new BadRequestException('Invalid or expired token');
      if (resetRecord.expiresAt < new Date()) {
        await this.prisma.passwordResetToken.delete({
          where: { token },
        });
        throw new BadRequestException('Token expired');
      }

      const hash = await argon.hash(newPassword);

      await this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hash },
      });

      await this.prisma.passwordResetToken.delete({ where: { token } });

      return { message: 'Password reset successful. You can now log in.' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }

  private async generateTokenPair(userId: string, email: string, role: string) {
    try {
      const payload = { sub: userId, email, role };

      const access_token = await this.jwt.signAsync(payload, {
        secret: this.config.get<string>('ACCESS_TOKEN_SECRET'),
        expiresIn: '15m',
      });

      const refresh_token = await this.jwt.signAsync(payload, {
        secret: this.config.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: '7d',
      });

      await this.prisma.refreshToken.create({
        data: {
          token: refresh_token,
          userId,
        },
      });

      return { access_token, refresh_token };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Oops! Something broke, but it's not your fault. Give it another go.",
      );
    }
  }
}
