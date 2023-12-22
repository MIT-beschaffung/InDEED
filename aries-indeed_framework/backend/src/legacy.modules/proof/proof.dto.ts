import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { Assetlog } from 'src/legacy.modules/assetlogs/assetlog.model';
import { MessageState } from 'src/generic.modules/base/messageState';
import { MessageType } from 'src/generic.modules/base/messageType';
import { ClaimDto } from 'src/specific.modules/claim/claim.dto';
import { ProducerLogData } from 'src/generic.modules/schemas/legacy/producer.model';
import { BaseDto } from '../../generic.modules/base/base.dto';

export class ProofDto extends BaseDto {

    claim: ClaimDto;
    assetlog: ProducerLogData;
    rootDB: string;
    state: string;
    
    constructor(
        connectionId: string,
        claim: ClaimDto,
        assetlog: ProducerLogData,
        state: MessageState = MessageState.Sending,
        rootDB: string,
    ) {
        super(connectionId, MessageType.Proof);
        this.claim = claim;
        this.assetlog = assetlog;
        this.state = state;
        this.rootDB = rootDB;
    }
}
