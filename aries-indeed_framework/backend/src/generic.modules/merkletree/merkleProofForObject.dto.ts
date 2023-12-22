import { ApiProperty } from "@nestjs/swagger";
import {IsNotEmpty, ValidateNested} from "class-validator";
// import { merkleLemmaElementDto } from "./merkleLemmaElement.dto";
import {merkleProofDto} from "./merkleProof.dto";

export class merkleProofForObjectDto {

    @ApiProperty({name: 'merkleProof', description: 'The merkle proof for the data object'})
    @IsNotEmpty()
    @ValidateNested({ each: true })
    merkleProof: merkleProofDto;

    @ApiProperty({name: 'object', description: 'The object (JSON) for which the proof is created'})
    @IsNotEmpty()
    @ValidateNested({ each: true })
    data: object;

    constructor(
        merkleProof: merkleProofDto,
        data: object
    ) {
        this.merkleProof = merkleProof;
        this.data = data;
    }

    setMerkleProof(merkleProof: merkleProofDto) {
        this.merkleProof = merkleProof;
    }

    setData(data: object) {
        this.data = data;
    }

    getMerkleProof(): merkleProofDto {
        return this.merkleProof;
    }

    getData(): object {
        return this.data;
    }


}
