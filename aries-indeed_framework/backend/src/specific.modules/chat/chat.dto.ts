import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { MessageState } from 'src/generic.modules/base/messageState';
import { MessageType } from 'src/generic.modules/base/messageType';
import { BaseDto } from '../../generic.modules/base/base.dto';

export class ChatDto extends BaseDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    message: string;

    @ApiProperty()
    state: MessageState;

    timestamp_received:number
    timestamp: number

    constructor(
        connectionId: string,
        timestamp: number,
        message: string,
        state: MessageState = MessageState.Received,
        timestamp_received: number
    ) {
        super(connectionId, MessageType.Chat);
        this.message = message;
        this.timestamp_received = timestamp_received;
        this.timestamp = timestamp;
        this.state = state;
    }
}