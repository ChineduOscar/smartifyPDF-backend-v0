import { Module } from '@nestjs/common';
import { TeacherApplicationController } from './teacher-application.controller';
import { TeacherApplicationService } from './teacher-application.service';

@Module({
  controllers: [TeacherApplicationController],
  providers: [TeacherApplicationService]
})
export class TeacherApplicationModule {}
