import { Test, TestingModule } from '@nestjs/testing';
import { LabelingController } from './labeling.controller';

describe('LabelingController', () => {
  let controller: LabelingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LabelingController],
    }).compile();

    controller = module.get<LabelingController>(LabelingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
