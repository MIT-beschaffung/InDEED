import { Test, TestingModule } from '@nestjs/testing';
import { NotarizationController } from './notarization.controller';

describe('NotarizationController', () => {
  let controller: NotarizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotarizationController],
    }).compile();

    controller = module.get<NotarizationController>(NotarizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
