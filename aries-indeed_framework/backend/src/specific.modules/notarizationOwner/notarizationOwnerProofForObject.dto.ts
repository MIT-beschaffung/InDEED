import { ApiProperty } from "@nestjs/swagger";
import {IsNotEmpty, ValidateNested} from "class-validator";
import {merkleProofDto} from "../../generic.modules/merkletree/merkleProof.dto";

export class notarizationOwnerProofForObjectDto {

    @ApiProperty({name: 'merkleProof', description: 'The merkle proof for the data object'})
    @IsNotEmpty()
    merkleProof: merkleProofDto;

    @ApiProperty({name: 'txHash', description: 'The quorum txHash for the data object'})
    @IsNotEmpty()
    txHash: string;

    @ApiProperty({name: 'object', description: 'The object (JSON) for which the proof is created'})
    @IsNotEmpty()
    data: object;

    constructor(
        merkleProof: merkleProofDto,
        txHash: string,
        data: object
    ) {
        this.merkleProof = merkleProof;
        this.txHash = txHash;
        this.data = data;
    }

    setMerkleProof(merkleProof: merkleProofDto) {
        this.merkleProof = merkleProof;
    }

    getMerkleProof(): merkleProofDto {
        return this.merkleProof;
    }

    setData(data: object) {
        this.data = data;
    }

    getData(): object {
        return this.data;
    }

    setTxHash(txHash: string){
        this.txHash = txHash;
    }

    getTxHash(): string{
        return this.txHash;
    }

}
