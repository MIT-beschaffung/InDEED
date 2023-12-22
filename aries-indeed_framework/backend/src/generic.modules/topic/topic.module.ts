// import { Module } from '@nestjs/common';
// import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';
// import { MyLogger } from 'src/generic.modules/logger/logger.service';
// import { TopicController } from './topic.controller';
// import { TopicService } from './topic.service';

// // The topic module is responsible for Handling the incoming Webhooks from the ACA-PY when a record is created.
// // When an record is created the ACA-Py issues a POST Request to "webhook URL"/topic/:topic. The :topic is the location where the record is created.
// // This record iis managed by the topic controller & service. The Webhooks get there with the nestjs architecture (topic/(connection/basicmessage ...))
// // Visit this URL for the full Webhook-API-Doku from ACA-PY
// // https://github.com/hyperledger/aries-cloudagent-python/blob/main/AdminAPI.md#administration-api-webhooks


// @Module({
//     imports: [MyLoggerModule],
//     controllers: [TopicController],
//     providers: [TopicService],
// })
// export class TopicModule { }
