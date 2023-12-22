import { Test, TestingModule } from '@nestjs/testing';
import { QuorumController } from './quorum.controller';

describe('QuorumController', () => {
  let controller: QuorumController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuorumController],
    }).compile();

    controller = module.get<QuorumController>(QuorumController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
