import { Injectable, BadRequestException, HttpException } from '@nestjs/common';
import { CreateTeacherApplicationDto } from 'src/dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TeacherApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}
  async apply(dto: CreateTeacherApplicationDto, cvFile: Express.Multer.File) {
    try {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedMimeTypes.includes(cvFile.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Only PDF and Word documents are allowed.',
        );
      }

      const cvUploadResult = await this.cloudinary.uploadFile(
        cvFile,
        'teacher-cvs',
      );

      const teacherApplication = await this.prisma.teacherApplication.create({
        data: {
          ...dto,
          cvDocument: cvUploadResult.secure_url,
        },
      });

      return {
        message: 'Application submitted successfully',
        data: {
          id: teacherApplication.id,
          email: teacherApplication.email,
          cvUrl: teacherApplication.cvDocument,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        error.message || 'Failed to submit teacher application',
      );
    }
  }

  async findAll() {
    return this.prisma.teacherApplication.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const application = await this.prisma.teacherApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new BadRequestException('Teacher application not found');
    }

    return application;
  }

  async deleteOne(id: string) {
    const application = await this.prisma.teacherApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new BadRequestException('Teacher application not found');
    }
    if (application.cvDocument) {
      await this.cloudinary.deleteFile(application.cvDocument);
    }
    await this.prisma.teacherApplication.delete({
      where: { id },
    });

    return { message: 'Application deleted successfully' };
  }
}
