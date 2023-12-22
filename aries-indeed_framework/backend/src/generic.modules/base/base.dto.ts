import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MessageState } from './messageState';

import { MessageType } from './messageType';

export class BaseDto {
    constructor(connectionId: string, /*state: MessageState*/ type: MessageType) {
        this.connectionId = connectionId;
        //this.state = state;
        this.type = type;
    }

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    connectionId: string;

    type: MessageType;

    // @ApiProperty({ enum: MessageState })
    // @IsEnum(MessageState)
    // @IsNotEmpty()
    //state: MessageState;
}


/*Warum ist der state Teil der DTO? Ist es sinnvoll den Messagestate tatsächlich mitzuschicken,
oder wäre es nicht sinnvoller den Messagestate jeweils auf Empfänger / Sender Seite festzulegen zu updaten? */ 