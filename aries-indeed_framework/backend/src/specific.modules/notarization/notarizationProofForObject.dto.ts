import { ApiProperty } from "@nestjs/swagger";
import {IsNotEmpty, ValidateNested} from "class-validator";
import { notarizationProofDto} from "./notarizationProof.dto";

export class notarizationProofForObjectDto {

    @ApiProperty({name: 'notarizationProof', description: 'The notarization proof for the data object'})
    @IsNotEmpty()
    notarizationProof: notarizationProofDto;

    @ApiProperty({name: 'object', description: 'The object (JSON) for which the proof is created'})
    @IsNotEmpty()
    data: object;

    constructor(
        notarizationProof: notarizationProofDto,
        data: object
    ) {
        this.notarizationProof = notarizationProof;
        this.data = data;
    }

    setNotarizationProof(notarizationProof: notarizationProofDto) {
        this.notarizationProof = notarizationProof;
    }

    setData(data: object) {
        this.data = data;
    }

    getNotarizationProof(): notarizationProofDto {
        return this.notarizationProof;
    }

    getData(): object {
        return this.data;
    }


}
