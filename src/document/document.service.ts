import { Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}
  async apply(file: Express.Multer.File) {
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
          publicId: documentUploadResult.public_id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      });

      return {
        message: 'Document uplaoded successfully',
        data: {
          id: document.id,
          document_url: document.documentUrl,
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
