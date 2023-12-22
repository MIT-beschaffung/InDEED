import {Body, Controller, Get, Post, UseGuards} from '@nestjs/common';
import {EventEmitter2, OnEvent} from '@nestjs/event-emitter';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiSecurity,
    ApiTags
} from '@nestjs/swagger';
import {APIKEYAuthGuard} from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import {Events} from 'src/events';
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {ChatDto} from './chat.dto';
import {ChatService} from './chat.service';
import {ChatStore} from './chat.store';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(APIKEYAuthGuard)
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly myLogger: MyLogger,
    ) {
        this.myLogger.setContext(this.constructor.name.toString())
    }

    @Post()
    @ApiOperation({summary: 'Create a new Chat message'})
    @ApiBody({type: ChatDto, description: 'Chat message that you want to send'})
    @ApiCreatedResponse({description: 'Returned if Chat message was successfully sent'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    sendNewChatMessage(@Body() completeBody: ChatDto) {
        return this.chatService.create(completeBody)
    }

    @Get()
    @ApiOperation({summary: 'Find all Chat messages'})
    @ApiOkResponse({description: 'Returned if Chat message could be found', type: [ChatStore]})
    @ApiSecurity('api_key', ['api_key'])
    getAllChatMessages() {
        return this.chatService.findAll()
    }

    @OnEvent(Events.newChatMessage)
    handlenewChatMessage(chatMessage: ChatDto) {
        return this.chatService.newMessageListener(chatMessage)
    }
}
