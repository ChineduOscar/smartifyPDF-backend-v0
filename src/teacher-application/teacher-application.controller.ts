import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeacherApplicationService } from './teacher-application.service';
import { CreateTeacherApplicationDto } from 'src/dto';

@Controller('teacher-applications')
export class TeacherApplicationController {
  constructor(
    private readonly teacherApplicationService: TeacherApplicationService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('cv'))
  async apply(
    @Body() createTeacherApplicationDto: CreateTeacherApplicationDto,
    @UploadedFile() cvFile: Express.Multer.File,
  ) {
    if (!cvFile) {
      throw new BadRequestException('CV file is required');
    }

    return this.teacherApplicationService.apply(
      createTeacherApplicationDto,
      cvFile,
    );
  }

  @Get()
  async findAll() {
    return this.teacherApplicationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teacherApplicationService.findOne(id);
  }

  @Delete(':id')
  async DeleteOne(@Param('id') id: string) {
    return this.teacherApplicationService.deleteOne(id);
  }
}
