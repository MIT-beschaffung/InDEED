import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";
import { BaseDto, BasicMessage, MessageState, MessageType } from "./base";

export interface Chat {
    state: MessageState;
    message: string;
}

export class ChatDto extends BaseDto<Chat, ChatDto> implements Chat {
    
    @ApiProperty()
    state: MessageState;
    
    @ApiProperty()
    @IsNotEmpty()
    message: string;

    timestamp: number;

    constructor(connectionId: string, message: string, state: MessageState = MessageState.Received, timestamp: number) {
        super(MessageType.Chat, connectionId);
        this.message = message;
        this.state = state;
        this.timestamp = timestamp;
    }

    toBasicMessage(): BasicMessage<ChatDto> {
        const content = {
            state: this.state,
            message: this.message,
            type: this.type,
        }
        const basicMessage = new BasicMessage<ChatDto>(this.connectionId, content);
        return basicMessage;
    }

    toBase(): Chat {
        return {
            state: this.state,
            message: this.message
        }
    }
}