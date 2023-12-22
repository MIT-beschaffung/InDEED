import { Controller} from '@nestjs/common';
import { MerkleProofService } from './proof.service';

@Controller('proof')
export class MerkleProofController {
  constructor(private readonly proofService: MerkleProofService) {}

  /*
  @Get()
  async getproof(@Body() claim: ClaimDto) {
    const proof = await this.proofService.proofHandler(claim);
    return proof;
  }

   */
}
