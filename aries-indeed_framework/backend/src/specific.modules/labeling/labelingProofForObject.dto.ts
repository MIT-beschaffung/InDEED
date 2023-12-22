import { ApiProperty } from "@nestjs/swagger";
import {IsNotEmpty, ValidateNested} from "class-validator";
import { labelingProofDto} from "./labelingProof.dto";

export class labelingProofForObjectDto {

    @ApiProperty({name: 'labelingProof', description: 'The labeling proof for the data object'})
    @IsNotEmpty()
    labelingProof: labelingProofDto;

    @ApiProperty({name: 'object', description: 'The object (JSON) for which the proof is created'})
    @IsNotEmpty()
    data: object;

    constructor(
        labelingProof: labelingProofDto,
        data: object
    ) {
        this.labelingProof = labelingProof;
        this.data = data;
    }

    setlabelingProof(labelingProof: labelingProofDto) {
        this.labelingProof = labelingProof;
    }

    setData(data: object) {
        this.data = data;
    }

    getlabelingProof(): labelingProofDto {
        return this.labelingProof;
    }

    getData(): object {
        return this.data;
    }


}
