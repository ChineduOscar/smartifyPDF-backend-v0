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

  @Post('upload-and-generate')
  @UseInterceptors(FileInterceptor('document'))
  async uploadAndGerate(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    return this.documentService.uploadAndGenerate(file);
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
