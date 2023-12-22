import { Test, TestingModule } from '@nestjs/testing';
import { MerkleProofController } from './proof.controller';

describe('ProofController', () => {
  let controller: MerkleProofController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MerkleProofController],
    }).compile();

    controller = module.get<MerkleProofController>(MerkleProofController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
