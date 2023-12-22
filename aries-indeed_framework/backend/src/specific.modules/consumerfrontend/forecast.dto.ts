import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class forecastDto {

    @ApiProperty({name: 'timestamp', description: 'current unix time'})
    @IsNotEmpty()
    timestamp: Number;

    @ApiProperty({name: 'data', description: 'calculated forecast data for each hour using ex ante (mean) (FfE)'})
    @IsNotEmpty()
    data: Object;

    constructor(
        timestamp: Number,
        data: Object
    ) {
        this.timestamp = timestamp;
        this.data = data;
    }


    setTime(timestamp: Number) {
        this.timestamp = timestamp;
    }

    getTime(): Number {
        return this.timestamp;
    }

    setData(data: Array<Object>) {
        this.data = data;
    }

    getData(): Object {
        return this.data;
    }
}
