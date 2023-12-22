import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class timeFrameDto {

    @ApiProperty({name: 'upperbound', description: 'Upperbound of time frame to be queried'})
    @IsNotEmpty()
    upperbound: Number;

    @ApiProperty({name: 'lowerbound', description: 'Lowerbound of time frame to be queried'})
    @IsNotEmpty()
    lowerbound:  Number;

    constructor(
        upperbound,
        lowerbound
    ) {
        this.upperbound = upperbound;
        this.lowerbound = lowerbound;
    }

    // setUpperbound(upperbound: Number) {
    //     this.upperbound = upperbound;
    // }

    // getUpperbound(): Number {
    //     return this.upperbound;
    // }

    // setLowerbound(lowerbound: Number) {
    //     this.lowerbound = lowerbound;
    // }

    // getLowerbound(): Number {
    //     return this.lowerbound;
    // }
}
