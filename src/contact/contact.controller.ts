import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from 'src/dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async sendMessage(@Body() dto: ContactDto) {
    return this.contactService.sendContactMessage(dto);
  }

  @Get()
  async getAllMessages() {
    return this.contactService.getAllContactMessages();
  }

  @Get(':id')
  async getMessageById(@Param('id') id: string) {
    return this.contactService.getContactMessageById(id);
  }

  @Delete(':id')
  async deleteMessage(@Param('id') id: string) {
    return this.contactService.deleteContactMessageById(id);
  }
}
