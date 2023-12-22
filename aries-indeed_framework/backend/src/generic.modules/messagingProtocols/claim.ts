import { BaseDto, BasicMessage, MessageState, MessageType } from "./base";

export interface Claim {
    state: MessageState;
    assetDid: string;
    timestamp: string;
}

export class ClaimDto extends BaseDto<Claim, ClaimDto> implements Claim {
    state: MessageState;
    assetDid: string;
    timestamp: string;

    constructor(connectionId: string, assetDid: string, timestamp: string, state: MessageState = MessageState.Received) {
        super(MessageType.Claim, connectionId);
        this.assetDid = assetDid;
        this.timestamp = timestamp;
        this.state = state;
    }

    toBasicMessage(): BasicMessage<ClaimDto> {
        const content = {
            state: this.state, // Receiving end of basic message has received status
            assetDid: this.assetDid,
            timestamp: this.timestamp,
            type: this.type,
        }
        const basicMessage = new BasicMessage<ClaimDto>(this.connectionId, content);
        return basicMessage;
    }

    toBase(): Claim {
        return {
            state: this.state,
            assetDid: this.assetDid,
            timestamp: this.timestamp,
        }
    }
}

