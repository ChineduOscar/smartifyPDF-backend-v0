import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { QuizModule } from 'src/quiz/quiz.module';
@Module({
  imports: [PrismaModule, CloudinaryModule, QuizModule],
  controllers: [DocumentController],
  providers: [DocumentService],
})
export class DocumentModule {}
