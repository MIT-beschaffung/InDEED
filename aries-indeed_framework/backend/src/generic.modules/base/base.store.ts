import { BaseDto } from './base.dto';

export class BaseStore<T extends BaseDto> {
    constructor(connectionId: string, messages: T[]) {
        this.connectionId = connectionId;
        this.messages = messages;
    }

    connectionId: string;

    messages: T[];
}
