import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";

export class ProofDto {

    @ApiProperty()
    @IsNotEmpty()
    groth16Proof: object;

    @ApiProperty()
    @IsNotEmpty()
    publicInputs: string[];

    constructor(
        groth16Proof: object,
        publicInputs: string[]
    ) {
        this.groth16Proof = groth16Proof;
        this.publicInputs = publicInputs;
    }

    setGroth16Proof(groth16Proof: object) {
        this.groth16Proof = groth16Proof;
    }

    setPublicInputs(publicInputs: string[]) {
        this.publicInputs = publicInputs;
    }

    getGroth16Proof(): object {
        return this.groth16Proof;
    }

    getPublicInputs(): string[] {
        return this.publicInputs;
    }
}
