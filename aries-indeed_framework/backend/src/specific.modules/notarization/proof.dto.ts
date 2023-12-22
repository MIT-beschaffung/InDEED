import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";
import {merkleProofDto} from "src/generic.modules/merkletree/merkleProof.dto";

export class proofDto {

    @ApiProperty()
    @IsNotEmpty()
    data: Object;

    @ApiProperty()
    @IsNotEmpty()
    merkleProof: merkleProofDto;

    @ApiProperty()
    @IsNotEmpty()
    transactionHash: string

    constructor(
        data: Object,
        merkleProof: merkleProofDto,
        transactionHash: string
    ) {
        this.data = data;
        this.merkleProof = merkleProof;
        this.transactionHash = transactionHash;
    }

}
