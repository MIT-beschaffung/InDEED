import { Test, TestingModule } from '@nestjs/testing';
import { MerkleProofService } from './proof.service';

describe('ProofService', () => {
  let service: MerkleProofService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MerkleProofService],
    }).compile();

    service = module.get<MerkleProofService>(MerkleProofService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
