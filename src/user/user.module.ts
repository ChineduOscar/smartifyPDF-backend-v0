import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CustomMailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [PrismaModule, CustomMailerModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
