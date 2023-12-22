import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseDto } from 'src/generic.modules/base/base.dto';
import { ConfigService } from 'src/config.service';
import { AriesClientService } from './aries-client.service';

@Controller('aries-client')
@ApiTags('Aries Client')
export class AriesClientController {
    constructor(
        private readonly ariesClientService: AriesClientService,
        private readonly config: ConfigService,
        ) {}

    // @Post("test")    
    // sendMessage(@Body() completeBody: BaseDto) {
    //     MyLogger.debug(completeBody)
    //     const connID: string = completeBody["connectionId"];
    //     MyLogger.debug(connID);
    //     const content = {
    //         type: completeBody["type"],
    //         message: completeBody["message"]
    //     };
    //     const result = this.ariesClientService.sendMessage(connID, content)
    //     return result;
    }


