import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class footprintDto {

    @ApiProperty({name: 'timestamp', description: 'current unix time'})
    @IsNotEmpty()
    timestamp: Number;

    @ApiProperty({name: 'days', description: '{"1d": data1, "7d": data2, "30d": data3}'})
    @IsNotEmpty()
    days: Object;

    constructor(
        timestamp: Number,
        days: Object
    ) {
        this.timestamp = timestamp;
        this.days = days;
    }


    setTime(timestamp: Number) {
        this.timestamp = timestamp;
    }

    getTime(): Number {
        return this.timestamp;
    }

    setdays(days: Array<Object>) {
        this.days = days;
    }

    getdays(): Object {
        return this.days;
    }
}
