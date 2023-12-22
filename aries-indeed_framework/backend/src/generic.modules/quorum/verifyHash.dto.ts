import {ApiProperty} from "@nestjs/swagger";
import {IsNotEmpty} from "class-validator";
import {HttpException, HttpStatus} from "@nestjs/common";

export class verifyHashDto {

    @ApiProperty()
    @IsNotEmpty()
    dataHash: string;

    @ApiProperty()
    @IsNotEmpty()
    transactionHash: string

    constructor(
        dataHash: string,
        transactionHash: string
    ) {
        this.dataHash = dataHash;
        this.transactionHash = transactionHash;
    }

    get verifiedDataHash(): string {
        if (this.dataHash.substring(0, 2) == "0x" && this.dataHash.length < 67) {
            console.debug(`Got dataHash: ${this.dataHash}`);
            return this.dataHash;
        } else {
            throw new HttpException("Invalid hash: must start with 0x and have less than 64 characters", HttpStatus.BAD_REQUEST);
        }
    }

}
