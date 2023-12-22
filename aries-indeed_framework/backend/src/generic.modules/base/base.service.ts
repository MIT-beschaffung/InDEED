import { Injectable } from '@nestjs/common';
import { BaseDto } from './base.dto';
import { BaseStore } from './base.store';
import {MyLogger} from "../logger/logger.service";

@Injectable()
export abstract class BaseService {
    
    constructor(private Logger: MyLogger){
        this.Logger.setContext(this.constructor.name.toString())
    }
    abstract findAll(): BaseStore<BaseDto>[];

    abstract create(baseDto: BaseDto): BaseDto;

    addToStore(store: BaseStore<BaseDto>[], dto: BaseDto): void {
        //TODO: Test auf Duplikat?
        const connectionIndex = store.findIndex(
            (storeItem) => storeItem.connectionId === dto.connectionId,
        );

        if (connectionIndex === -1) {
            const storeEntry = new BaseStore(dto.connectionId, [dto]);
            store.push(storeEntry);
            this.Logger.debug('push');
            // calls für Websocket --> Übertragung an Frontend (oder einfach Response)
        } else {
            store[connectionIndex].messages.push(dto);
            // calls für Websocket --> Übertragung an Frontend (oder einfach Response)
        }
    }

    abstract update(dto: BaseDto): void;

    updateInStore(
        store: BaseStore<BaseDto>[],
        dto: BaseDto,
        updateCondition: (c: BaseDto) => boolean,
    ): void {
        const connectionIndex = store.findIndex(
            (storeItem) => storeItem.connectionId === dto.connectionId,
        );
        if (connectionIndex !== -1) {
            const claimIndex = store[
                connectionIndex
            ].messages.findIndex((messageItem: BaseDto) =>
                updateCondition(messageItem),
            );
            if (claimIndex !== -1) {
                store[connectionIndex].messages[claimIndex] = dto;
                // calls für Websocket --> Übertragung an Frontend (oder einfach Response)
            }
        }
    }

    abstract delete(dto: BaseDto): void;

    deleteFromStore(
        store: BaseStore<BaseDto>[],
        dto: BaseDto,
        deleteCondition: (c: BaseDto) => boolean,
    ): void {
        const connectionIndex = store.findIndex(
            (storeItem) => storeItem.connectionId === dto.connectionId,
        );
        if (connectionIndex !== -1) {
            const claimIndex = store[
                connectionIndex
            ].messages.findIndex((messageItem: BaseDto) =>
                deleteCondition(messageItem),
            );
            if (claimIndex !== -1) {
                store[connectionIndex].messages.splice(claimIndex, 1);
                if (store[connectionIndex].messages.length === 0) {
                    store.splice(connectionIndex, 1);
                }
                // calls für Websocket --> Übertragung an Frontend (oder einfach Response)
            }
        }
    }
}
