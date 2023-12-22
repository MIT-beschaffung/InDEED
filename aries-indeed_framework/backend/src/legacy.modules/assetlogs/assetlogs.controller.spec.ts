import { Test, TestingModule } from '@nestjs/testing';
import { AssetlogsController } from './assetlogs.controller';

describe('AssetlogsController', () => {
  let controller: AssetlogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetlogsController],
    }).compile();

    controller = module.get<AssetlogsController>(AssetlogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
