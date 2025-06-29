import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ContactDto } from 'src/dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}
  async sendContactMessage(dto: ContactDto) {
    const { firstName, lastName, email, message } = dto;

    if (!firstName || !lastName || !email || !message) {
      throw new BadRequestException('All fields are required.');
    }

    try {
      await this.prisma.contactMessage.create({ data: dto });
      return {
        message: 'Thanks for contacting us! We will get back to you soon.',
      };
    } catch (error) {
      throw new Error('Failed to send contact message');
    }
  }

  async getAllContactMessages() {
    try {
      return this.prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error('Failed to get all contact message');
    }
  }

  async getContactMessageById(id: string) {
    if (!id) throw new BadRequestException('ID is required');
    try {
      const message = await this.prisma.contactMessage.findUnique({
        where: { id },
      });

      if (!message) throw new NotFoundException('Message not found');

      return message;
    } catch (error) {
      throw new Error(`Failed to get contact message with ID ${id}`);
    }
  }

  async deleteContactMessageById(id: string) {
    if (!id) throw new BadRequestException('ID is required');

    try {
      const existing = await this.prisma.contactMessage.findUnique({
        where: { id },
      });

      if (!existing)
        throw new NotFoundException('Message not found or already deleted');

      const deleted = await this.prisma.contactMessage.delete({
        where: { id },
      });

      return {
        message: 'Contact message deleted successfully',
        data: deleted,
      };
    } catch (error) {
      throw new Error(`Failed to delete contact message with ID ${id}`);
    }
  }
}
