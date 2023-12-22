import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { locationDto } from "./location.dto";
export class masterRegistryDto {

    @ApiProperty({name: 'pubKey_x', description: 'The x-Compononent of the public key'})
    @IsNotEmpty()
    pubKey_x: string;

    @ApiProperty({name: 'location', description: 'The location as a tuple of latitude and longitude'})
    @IsNotEmpty()
    location: locationDto;

    @ApiProperty({name: 'preference', description: 'The preference to be delivered green of a Consumer'})
    preference: object;

    @ApiProperty({name: 'source', description: 'The source of the power, e.g., hydro, wind, etc.'})
    source: string;

    @ApiProperty({name: 'prosumer_name', description: 'The prosumer_name who deliverd the power'})
    prosumer_name: string;

    constructor(
        pubKey_x,
        location,
        preference,
        source,
        prosumer_name
    ) {
        this.pubKey_x = pubKey_x;
        this.location = location;
        this.preference = preference;
        this.source = source;
        this.prosumer_name = prosumer_name;
    }
}