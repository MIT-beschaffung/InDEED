import { Test, TestingModule } from '@nestjs/testing';
import { AssetlogsService } from './assetlogs.service';

describe('AssetlogsService', () => {
  let service: AssetlogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetlogsService],
    }).compile();

    service = module.get<AssetlogsService>(AssetlogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
