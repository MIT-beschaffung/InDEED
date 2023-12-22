export enum MessageType {
    Chat = "chat",
    Claim = "claim",
}

export enum MessageState {
    Sent = "sent",
    Received = "received",
    RequestData = "request_data",
}

export class MessageStore<T> {
    connectionId: string;
    messages: T[];
}

export class BasicMessage<Dto> {
    constructor(readonly connectionId: string, readonly content: Partial<Dto>) { }
}

export abstract class BaseDto<BaseType, Dto> {
    constructor(readonly type: MessageType, readonly connectionId: string) { }

    abstract toBasicMessage(): BasicMessage<Dto>;

    abstract toBase(): BaseType;
}