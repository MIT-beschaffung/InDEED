// import { Injectable } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { MessageState } from 'src/generic.modules/base/messageState';
// import { MessageType } from 'src/generic.modules/base/messageType';
// import { ClaimDto } from 'src/specific.modules/claim/claim.dto';
// import { Events } from 'src/events';
// import { MyLogger } from 'src/generic.modules/logger/logger.service';
// import { ChatDto } from '../../specific.modules/chat/chat.dto';

// // Define possible states for Connection
// enum ConnectionStates {
//     init = 'init',
//     invitation = 'invitation',
//     request = 'request',
//     response = 'response',
//     active = 'active',
//     err = 'error',
//     inactive = 'inactive',
// }

// @Injectable()
// export class TopicService {
//     constructor(
//         private myLogger: MyLogger,
//         private eventEmitter: EventEmitter2,
//     ) {this.myLogger.setContext(this.constructor.name.toString())}

//     async handleConnectionWebhook(body: object) {
//         let state = body['state'];
//         this.myLogger.log(`Connectionstate: ${JSON.stringify(state)}`);
//         this.myLogger.log(`Connectionupdate: ${JSON.stringify(body)}`);
//         if (state === ConnectionStates[6]) {
//             this.myLogger.error(`Wrong message type send to webhook handler`);
//             return;
//         }

//         // this.connectionSubject.next(body);
//         return;
//     }

//     async handleBasicMessagingWebhook(body: object) {
//         const connID = body['connection_id'];
//         const messageID = body['message_id'];
//         const temp = body['content'];
//         //const state = body['state'];
//         const timestamp_received = Date.now();

//         //Checks if the incoming webhook contains the message or if it is "just" the feedback, that the message was sent successfully
//         if (
//             typeof temp == 'string' &&
//             temp.includes('-Agent received your message')
//         ) {
//             //TODO sth like do nothing or update the sent message, that it was sent successfully. Maybe not that important now. Implement later.
//             this.myLogger.log(body);

//             //Emits a new Event, to trigger the chat module.
//             this.eventEmitter.emit(Events.updateChatMessageState, {
//                 newState: MessageState.Sent,
//                 connection_id: connID,
//             });
//         } else if (typeof temp == 'string') {
//             const content = JSON.parse(temp);
//             const timestamp = content['timestamp'];
//             this.myLogger.log(
//                 `New Message received from connection ${connID}: ${JSON.stringify(
//                     body,
//                 )}`,
//             );

//             if (content['type'] === MessageType.Chat) {
//                 this.myLogger.debug('new CHAT message received');

//                 //Emits a new Event, that triggers the chat module (some normal chatting)
//                 this.eventEmitter.emit(
//                     Events.newChatMessage,
//                     new ChatDto(
//                         connID,
//                         timestamp,
//                         content['message'],
//                         MessageState.Received,
//                         timestamp_received,
//                     ),
//                 );
//             } else if (content['type'] === MessageType.Claim) {
//                 this.myLogger.debug('new Claim received');

//                 //Emits a new Event, that triggers the claim Module (get the proof from db and send it back)
//                 this.eventEmitter.emit(
//                     Events.newClaim,
//                     new ClaimDto(
//                         connID,
//                         timestamp,
//                         content['assetlogId'],
//                         MessageState.RequestData,
//                         timestamp_received,
//                     ),
//                 );
//             } else if (content['type'] === MessageType.Proof) {
//                 this.myLogger.debug('New Proof received');

//                 //Emits a new Event, that triggers the claim Module (verify the proof)
//                 this.eventEmitter.emit(Events.newProof, content)
//             }
//         }
//         return;
//     }

//     async handleIssueCredentialWebhook(body: any) {
//         const connID = body['connection_id'];
//         const xChangeID = body['credential_exchange_id'];
//         const threadID = body['thread_id'];
//         const state = body['state'];
//         // if(this.credentialXchangeStates.indexOf(state) === -1){
//         //      this.myLogger.error(`Wrong message type send to webhook issue credential handler: ${state}`);
//         //      return;
//         //  }

//         this.myLogger.debug(
//             `Webhook Issue Credential ${connID} State ${body['state']} ThreadID ${threadID}`,
//         );
//         this.myLogger.debug(
//             `Issue Credential ${connID} \nResponse Body: ${JSON.stringify(
//                 body,
//             )}`,
//         );
//         return;
//     }

//     async handlePresentProofWebhook(body: any) {
//         const connID = body['connection_id'];
//         const state = body['state'];
//         const threadID = body['thread_id'];
//         // if(this.presentationStates.indexOf(state) === -1){
//         //      this.logger.error(`${this.name}: Wrong message type ${state} send to webhook handler`);
//         //      return;
//         //  }
//         if (state == 'request_sent' || state == 'request_received') {
//             this.myLogger.debug(`Webhook: ${state} send to webhook handler`);
//             return;
//         }

//         return;
//     }
// }
