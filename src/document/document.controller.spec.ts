import { Test, TestingModule } from '@nestjs/testing';
import { TeacherApplicationController } from './document.controller';

describe('TeacherApplicationController', () => {
  let controller: TeacherApplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeacherApplicationController],
    }).compile();

    controller = module.get<TeacherApplicationController>(
      TeacherApplicationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
