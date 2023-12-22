import {
    Controller,
    HttpException,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiTags,
    ApiResponse,
    ApiSecurity,
} from '@nestjs/swagger';
import { QuorumService } from './quorum.service';
import { MyLogger } from '../logger/logger.service';
import { APIKEYAuthGuard } from '../../specific.modules/authentication/guards/apikey-auth.guard';

@ApiTags('Quorum')
@Controller('quorum')
@UseGuards(APIKEYAuthGuard)
export class QuorumController {
    constructor(
        private readonly quorumService: QuorumService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Post('writeData/:data')
    @ApiOperation({summary: 'Notarize data on the quorum blockchain and returns transaction hash as receipt'})
    @ApiResponse({status: 201, description: 'The record has been successfully notarized.',})
    @ApiSecurity('api_key', ['api_key'])
    async writeHash(@Param('data') data: string) {
        //TODO: make a nice data type for hex (<64 characters) and hash (= hex with 64 characters)
        this.MyLogger.debug('Checking if data is a hexadecimal');
        this.MyLogger.debug('data: ' + data);
        if (data.substr(0, 2) == '0x') {
            this.MyLogger.debug('Removing leading 0x');
            data = data.substr(2);
        } else {
            this.MyLogger.debug('No leading 0x');
        }

        if (data.length > 64) {
            this.MyLogger.debug('Too long (max 64 characters)');
            throw new HttpException('Input too long (max. 64 characters)', 400);
        } else {
            this.MyLogger.debug('Valid length: ' + data.length);
        }

        if (/^[A-F0-9]+$/i.test(data)) {
            return this.quorumService.writeData('0x' + data);
        } else {
            throw new HttpException('Input is no hex string', 400);
        }
    }

    @Post('verifyData/:data&:txHash')
    @ApiOperation({summary: 'Verify whether some data was previously written to the quorum blockchain'})
    @ApiResponse({ status: 201, description: 'The record was checked.' })
    @ApiSecurity('api_key', ['api_key'])
    async verifyData(@Param('data') data: string, @Param('txHash') txHash: string) {
        this.MyLogger.log('data: ' + data + '; txHash: ' + txHash);

        this.MyLogger.debug('Checking if data is a hexadecimal');
        this.MyLogger.debug('data: ' + data);
        if (data.substr(0, 2) == '0x') {
            this.MyLogger.debug('Removing leading 0x');
            data = data.substr(2);
        } else {
            this.MyLogger.debug('No leading 0x');
        }

        if (data.length > 64) {
            this.MyLogger.debug('Too long (max 64 characters)');
            throw new HttpException('Input too long (max. 64 characters)', 400);
        } else {
            this.MyLogger.debug('Valid length: ' + data.length);
        }

        if (/^[A-F0-9]+$/i.test(data)) {
        } else {
            throw new HttpException('Input is no hex string', 400);
        }

        this.MyLogger.debug('Checking if txHash is a hash');
        this.MyLogger.debug('txHash: ' + txHash);
        if (txHash.substr(0, 2) == '0x') {
            this.MyLogger.debug('Removing leading 0x');
            txHash = txHash.substr(2);
        } else {
            this.MyLogger.debug('No leading 0x');
        }

        if (txHash.length != 64) {
            this.MyLogger.debug(
                'Not the length of a hash (needs 64 characters)',
            );
            throw new HttpException('Input not 64 characters)', 400);
        } else {
            this.MyLogger.debug('Valid length: ' + txHash.length);
        }

        if (/^[A-F0-9]+$/i.test(txHash)) {
        } else {
            throw new HttpException('Input is no hex string', 400);
        }

        const result = await this.quorumService.verifyHash(
            '0x' + data,
            '0x' + txHash,
        );
        if (parseInt(result.blockNumber) >= 0) {
            return {
                valid: true,
                blockNumber: result.blockNumber,
                timestamp: result.timestamp,
                timestampReadable: result.timestampReadable
            };
        } else {
            return {
                valid: false,
                blockNumber: undefined,
                timestampReadable: undefined
            };
        }
    }
}
