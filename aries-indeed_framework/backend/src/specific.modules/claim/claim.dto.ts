import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { MessageState } from 'src/generic.modules/base/messageState';
import { MessageType } from 'src/generic.modules/base/messageType';
import { BaseDto } from 'src/generic.modules/base/base.dto';

export class ClaimDto extends BaseDto {
    @ApiProperty()
    @IsNotEmpty()
    type: MessageType;

    @ApiProperty()
    @IsNotEmpty()
    assetlogId: string;

    state: MessageState;
    timestamp_received: number;
    timestamp: number;

    constructor(
        connectionId: string,
        timestamp: number,
        assetlogId: string,
        state: MessageState = MessageState.Received,
        timestamp_received: number,
    ) {
        super(connectionId, MessageType.Claim);
        this.assetlogId = assetlogId;
        this.timestamp = timestamp;
        this.state = state;
        this.timestamp_received = timestamp_received;
    }
}
