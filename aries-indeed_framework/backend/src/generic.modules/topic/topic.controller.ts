// import { Body, Controller, Get, Post } from '@nestjs/common';
// import { MyLogger } from 'src/generic.modules/logger/logger.service';
// import { TopicService } from './topic.service';
// // Visit this URL for the full Webhook-API-Doku from ACA-PY
// // https://github.com/hyperledger/aries-cloudagent-python/blob/main/AdminAPI.md#administration-api-webhooks
// // Webhooks are issued every time the ACA-Py is triggered. This Controller handles the incoming POST Requests, by logging them with our own logging service.
// // The incoming POST Requests are sorted with decorators (Connections / basicmessages etc.)

// @Controller('topic')
// export class TopicController {
//     constructor(
//         private readonly topicService: TopicService,
//         private readonly myLogger: MyLogger
//     ) {this.myLogger.setContext(this.constructor.name.toString())}


//     @Post('connections')
//     conn(@Body() completeBody) {
//         this.myLogger.log('New connection Update')
//         if (completeBody['state']) {
//             this.topicService.handleConnectionWebhook(completeBody)
//         }
//         else {
//             this.myLogger.error('No state assigned - Request is not valid')
//         }
//      }
    
//     @Post('basicmessages')
//     bmsg(@Body() completeBody) {
//         //this.myLogger.log('New Message')
//         if (completeBody['state']) {
//             this.topicService.handleBasicMessagingWebhook(completeBody)
//         }
//         else {
//             this.myLogger.error('No state assigned - Request is not valid')
//         }
//     }

//     @Post('forward')
//     fwd(@Body() completeBody){
//         this.myLogger.log('New connection Forward Webhook')
//         if (completeBody['state']) {
//             this.myLogger.debug('This is not yet implemented')
//         }
//         else {
//             this.myLogger.error('No state assigned - Request is not valid')
//         }
//     }

//     @Post('issue_credential')
//     issue_cred(@Body() completeBody) {
//         this.myLogger.log('New Credential Issue')
//         if (completeBody['state']) {
//             this.topicService.handleIssueCredentialWebhook(completeBody)
//         }
//         else {
//             this.myLogger.error('No state assigned - Request is not valid')
//         }
//     }

//     @Post('present_proof')
//     present_proof(@Body() completeBody) {
//         this.myLogger.log('New Proof Presentation Webhook')
//         if (completeBody['state']) {
//             this.topicService.handlePresentProofWebhook(completeBody)
//         }
//         else {
//             this.myLogger.error('No state assigned - Request is not valid')
//         }
//     }

//     @Post('test')
//     topictesting(@Body() completeBody) {
//         this.myLogger.log(`this is a test POST request. \nThis body was attached: ${JSON.stringify(completeBody)}`)
//         return 'this was a test have a nice day'
//     }



// }
