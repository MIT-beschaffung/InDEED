import { ApiProperty } from "@nestjs/swagger";
import {IsArray, IsNotEmpty, ValidateNested} from "class-validator";
import { merkleProofDto } from "src/generic.modules/merkletree/merkleProof.dto";



export class notarizationProofDto {

    @ApiProperty({name: 'Merkle proof', description: 'The Merkle proof'})
    @IsNotEmpty()
    merkleProof: merkleProofDto;

    @ApiProperty({name: 'txHash', description: 'transaction that points to the root referenced in the Merkle proof'})
    @IsNotEmpty()
    txHash: string;

    constructor(
        merkleProof: merkleProofDto,
        txHash: string,
    ) {
        this.merkleProof = merkleProof;
        this.txHash = txHash;
    }

    setMerkleProof(merkleProof: merkleProofDto) {
        this.merkleProof = merkleProof;
    }

    getMerkleProof(): merkleProofDto {
        return this.merkleProof;
    }

    setTxHash(txHash: string) {
        this.txHash = txHash;
    }

    getTxHash(): string {
        return this.txHash;
    }

}
