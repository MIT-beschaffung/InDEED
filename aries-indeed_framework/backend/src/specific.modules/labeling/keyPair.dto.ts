import { ApiProperty } from "@nestjs/swagger";
import {IsArray, IsNotEmpty, ValidateNested} from "class-validator";

export class keyPairDto {

    @ApiProperty({name: 'sKey', description: 'The secret key'})
    @IsNotEmpty()
    sKey: string;

    @ApiProperty({name: 'pKey', description: 'The public key'})
    @IsNotEmpty()
    pKey: string[];

    
    constructor(
        sKey,
        pKey,
    ) {
        this.sKey = sKey;
        this.pKey = pKey;
    }

    setSKey(sKey: string) {
        this.sKey = sKey;
    }

    getSKey(): string {
        return this.sKey;
    }

    setPKey(pKey: string[]) {
        this.pKey = pKey;
    }

    getPKey(): string[] {
        return this.pKey;
    }
}