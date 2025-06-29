import { Module } from '@nestjs/common';
import { MailerService as CustomMailerService } from './mailer.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT'),
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"${config.get('MAIL_FROM_NAME')}" <${config.get('MAIL_FROM_EMAIL')}>`,
        },
      }),
    }),
  ],
  providers: [CustomMailerService],
  exports: [CustomMailerService, MailerModule],
})
export class CustomMailerModule {}
