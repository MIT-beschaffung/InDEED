import { Test, TestingModule } from '@nestjs/testing';
import { QuorumService } from './quorum.service';

describe('QuorumService', () => {
  let service: QuorumService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuorumService],
    }).compile();

    service = module.get<QuorumService>(QuorumService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
