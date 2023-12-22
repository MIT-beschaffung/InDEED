import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class locationDto {
    @ApiProperty({name: 'latitude', description: 'The latitude of property "location"'})
    @IsNotEmpty()
    latitude: number;
    
    @ApiProperty({name: 'longitude', description: 'The longitude of property "location"'})
    @IsNotEmpty()
    longitude: number;

    constructor(
        latitude,
        longitude
    ) {
        this.latitude = latitude;
        this.longitude = longitude;
    }
}