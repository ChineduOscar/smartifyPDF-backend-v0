import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('document'))
  async apply(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    return this.documentService.apply(file);
  }

  @Get()
  async findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Delete(':id')
  async DeleteOne(@Param('id') id: string) {
    return this.documentService.deleteOne(id);
  }
}
