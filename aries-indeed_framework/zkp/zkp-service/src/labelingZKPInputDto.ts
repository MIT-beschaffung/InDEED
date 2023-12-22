import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";

export class labelingZKPInfoDto {

    @ApiProperty({name: 'valid', description: 'validity or success of creating the ZKP'})
    @IsNotEmpty()
    valid: boolean;

    @ApiProperty({name: 'txHash', description: 'transaction hash'})
    @IsNotEmpty()
    txHash: string;

    @ApiProperty({name: 'publicInputs', description: 'Publpic inputs of the ZKP'})
    @IsNotEmpty()
    publicInputs: string[];

    constructor(
        valid: boolean,
        txHash: string,
        publicInputs: string[]
    ) {
        this.valid = valid,
        this.txHash = txHash;
        this.publicInputs = publicInputs;
    }

    getValid(): boolean {
        return this.valid
    }

    getTxHash(): string {
        return this.txHash
    }

    getPublicInputs(): string[] {
        return this.publicInputs;
    }
}