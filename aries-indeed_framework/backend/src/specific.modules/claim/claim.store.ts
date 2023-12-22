import { ApiProperty } from '@nestjs/swagger';
import { BaseStore } from 'src/generic.modules/base/base.store';
import { ClaimDto } from './claim.dto';

export class ClaimStore extends BaseStore<ClaimDto> {
    constructor(connectionId: string, messages: ClaimDto[]) {
        super(connectionId, messages);
        this.connectionId = connectionId;
        this.messages = messages;
    }

    @ApiProperty()
    connectionId: string;

    @ApiProperty({ type: [ClaimDto] })
    messages: ClaimDto[];
}
