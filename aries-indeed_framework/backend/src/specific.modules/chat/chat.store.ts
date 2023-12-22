import { ApiProperty } from '@nestjs/swagger';
import { ChatDto } from 'src/generic.modules/messagingProtocols/chat';
import { BaseStore } from '../../generic.modules/base/base.store';


export class ChatStore extends BaseStore<ChatDto> {
    constructor(connectionId: string, messages: ChatDto[]) {
        super(connectionId, messages);
        this.connectionId = connectionId;
        this.messages = messages;
    }

    @ApiProperty()
    connectionId: string;

    @ApiProperty({ type: [ChatDto] })
    messages: ChatDto[];
}
