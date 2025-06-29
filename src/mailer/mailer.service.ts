import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import {
  welcomeEmailHtml,
  verificationEmailHtml,
  resetPasswordEmailHTML,
} from './templates/mail-templates';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly mailerService: NestMailerService) {}

  async sendVerificationCode(email: string, name: string, code: string) {
    try {
      const html = verificationEmailHtml(name, code);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email',
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    try {
      const html = welcomeEmailHtml(name);
      await this.mailerService.sendMail({
        to,
        subject: 'Welcome to Afrilearn!',
        html,
      });
    } catch (error) {
      this.logger.warn(`Failed to send welcome email to ${to}`, error);
      throw error;
    }
  }

  async sendResetPasswordEmail(email: string, resetLink: string) {
    try {
      const html = resetPasswordEmailHTML(resetLink);
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password',
        html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${email}`,
        error,
      );
      throw error;
    }
  }
}
