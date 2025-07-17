import { Test, TestingModule } from '@nestjs/testing';
import { TeacherApplicationService } from './document.service';

describe('TeacherApplicationService', () => {
  let service: TeacherApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeacherApplicationService],
    }).compile();

    service = module.get<TeacherApplicationService>(TeacherApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
