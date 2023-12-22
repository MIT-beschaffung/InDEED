import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { MessageState } from 'src/generic.modules/base/messageState';
import { MessageType } from 'src/generic.modules/base/messageType';
import { BaseDto } from '../../generic.modules/base/base.dto';

export class AssetlogDto {
    @ApiProperty()
    @IsNotEmpty()
    location: string;

    @ApiProperty()
    @IsNotEmpty()
    label: string;


    @ApiProperty()
    @IsNotEmpty()
    someValue: number;

    constructor(
        location: string,
        label: string,
        someValue: number
    ) {
        this.location = location,
        this.label = label,
        this.someValue = someValue
    }
}