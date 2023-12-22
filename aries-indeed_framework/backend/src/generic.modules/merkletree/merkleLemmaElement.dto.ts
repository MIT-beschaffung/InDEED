import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";


export class merkleLemmaElementDto {

    @ApiProperty({name: 'position', description: 'Indicates whether joining happens from the left right'})
    @IsNotEmpty()
    position: string;

    @ApiProperty({name: 'data', description: 'The data whose hash should correspond to the leaf of the Merkle tree'})
    @IsNotEmpty()
    data: string;

    constructor(
        position: string,
        data: string,
    ) {
        this.position = position;
        this.data = data;
    }

    setPosition(position: string) {
        this.position = position;
    }

    setData(data: string) {
        this.data = data;
    }

    getPosition(): string {
        return this.position;
    }

    getData(): string {
        return this.data;
    }

}
