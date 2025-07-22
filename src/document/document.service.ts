import { Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { QuizService } from 'src/quiz/quiz.service';
import axios from 'axios';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly quizService: QuizService,
  ) {}
  async uploadAndGenerate(file: Express.Multer.File) {
    try {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only PDF and Word documents are allowed.',
        );
      }

      const documentUploadResult = await this.cloudinary.uploadFile(
        file,
        'document-upload-v0',
      );

      const document = await this.prisma.anonymousDocument.create({
        data: {
          documentUrl: documentUploadResult.secure_url,
          documentName: file.originalname,
          publicId: documentUploadResult.public_id,
        },
      });

      const aiResponse = await axios.post(
        'http://localhost:5000/quiz/generate',
        {
          document_url: document.documentUrl,
        },
      );

      const { document_info, questions, success } = aiResponse.data;

      if (!success || !questions?.length) {
        throw new BadRequestException('AI failed to generate questions');
      }

      const result = await this.quizService.store({ questions, document_info });

      return {
        message: 'Document uploaded and quiz generated',
        data: {
          ...result,
          documentName: document.documentName,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Document upload failed');
    }
  }

  async findAll() {
    return this.prisma.anonymousDocument.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.anonymousDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }

    return document;
  }

  async deleteOne(id: string) {
    const document = await this.prisma.anonymousDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new BadRequestException('Document not found');
    }
    if (document.documentUrl) {
      await this.cloudinary.deleteFile(document.documentUrl);
    }
    await this.prisma.anonymousDocument.delete({
      where: { id },
    });

    return { message: 'Document deleted successfully' };
  }
}
