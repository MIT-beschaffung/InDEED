import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AriesClientService } from 'src/generic.modules/aries-client/aries-client.service';
import { BaseService } from 'src/generic.modules/base/base.service';
import { MessageState } from 'src/generic.modules/base/messageState';
import { Events } from 'src/events';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { ChatDto } from './chat.dto';
import { ChatStore } from './chat.store';

//Naming überprüfen!

@Injectable()
export class ChatService extends BaseService {
    private dummychat: ChatStore = {
        connectionId: 'dummy',
        messages: [],
    };
    private chatStore: ChatStore[] = [];
    //ChatStore

    constructor(
        private readonly myLogger: MyLogger,
        private readonly eventEmitter: EventEmitter2,
        private readonly ariesClient: AriesClientService,
    ) {
        super(myLogger);
        this.myLogger.setContext(this.constructor.name.toString())
    }

    create(chatMsg: ChatDto) {
        //As long as the message has not arrived at the receiver the MSGState is pending.
        chatMsg['state'] = MessageState.Sending;
        chatMsg['timestamp'] = Date.now();

        try {
            //Send the message to the agent with the agent module
            this.ariesClient.sendMessage(chatMsg['connectionId'], chatMsg);
            this.myLogger.log(chatMsg);
        } catch (error) {
            this.myLogger.error(
                `Error while sending message to Connection ${chatMsg['connectionId']}`,
            );
            chatMsg['state'] = MessageState.ERROR;
        }

        //Triggers the new Chat Message event to save the message in the ChatStore
        this.eventEmitter.emit(Events.newChatMessage, chatMsg);

        return chatMsg;
    }

    update() {}

    delete() {}

    findAll(): ChatStore[] {
        return this.chatStore;
    }

    newMessageListener(Message: ChatDto) {
        //this.myLogger.log(Message);
        this.addToStore(this.chatStore, Message);
    }
}
