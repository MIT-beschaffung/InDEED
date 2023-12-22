import { Test, TestingModule } from '@nestjs/testing';
import { NotarizationService } from './notarization.service';

describe('NotarizationService', () => {
  let service: NotarizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotarizationService],
    }).compile();

    service = module.get<NotarizationService>(NotarizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
