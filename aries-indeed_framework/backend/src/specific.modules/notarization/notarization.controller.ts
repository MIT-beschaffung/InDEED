import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { NotarizationService } from './notarization.service';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import { notarizationProofForObjectDto } from 'src/specific.modules/notarization/notarizationProofForObject.dto';
import { APIKEYAuthGuard } from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import { MyLogger } from 'src/generic.modules/logger/logger.service';
import { DatabaseService } from 'src/generic.modules/database/database.service';
import { databases } from 'src/generic.modules/database/db.enum';

@ApiTags('Notarization')
@Controller('notarize')
@UseGuards(APIKEYAuthGuard)
export class NotarizationController {
    constructor(
        private readonly notarizationService: NotarizationService,
        private readonly databaseService: DatabaseService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Post('notarizeObjects')
    @ApiOperation({summary: 'Notarize an array of JSON objects through building a Merkle tree and logging its root on the Quorum blockchain'})
    @ApiBody({type: [Object], description: 'Object JSON array to be notarized'})
    @ApiResponse({status: 201, description: 'The records have been successfully aggregated.'})
    @ApiSecurity('api_key', ['api_key'])
    async notarizeObjects(@Body() completeBody) {
        this.MyLogger.info('serving /notarizeObjects');
        try {
            return this.notarizationService.notarizeObjects(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to notarize some Objects: ');
            this.MyLogger.error(error);
        }
    }

    @Post('notarizeIds')
    @ApiOperation({summary: 'Notarizes the logged data corresponding to an array of ids'})
    @ApiBody({description: 'id array of logged data to be notarized', type: [String]})
    @ApiSecurity('api_key', ['api_key'])
    async notarizeIds(@Body() completeBody) {
        this.MyLogger.info('serving /notarizeIds');
        try {
            return this.notarizationService.notarizeIDs(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to notarize some IDs: ');
            this.MyLogger.error(error);
        }
    }

    @Post('verifyNotarizationProof')
    @ApiOperation({summary: 'Verify a notarization proof through locally checking the Merkle proof and reading from the Quorum blockchain'})
    @ApiBody({type: notarizationProofForObjectDto, description: 'A notarization proof'})
    @ApiResponse({ status: 201, description: 'The record was checked.' })
    @ApiSecurity('api_key', ['api_key'])
    async verifyNotarizationProof(@Body() completeBody: notarizationProofForObjectDto) {
        this.MyLogger.info('serving /verifyNotarizationProof');
        try {
            return this.notarizationService.verifyNotarizationProof(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to verify a notarization Proof: ');
            this.MyLogger.error(error);
        }
    }
    
    @Get()
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently saved documents'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLogData() {
        this.MyLogger.info('serving GET /');
        try {
            const result = await this.databaseService.getAllIDs(databases.NotarizedDataDB);
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                    databases.NotarizedDataDB + '\n' + error);
            return error;
        }
    }

    @Get(':id')
    @ApiOperation({summary: 'Get logged and notarized data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving GET /:id');
        try {
            const res = await this.databaseService.findByID(id, databases.NotarizedDataDB);
            this.MyLogger.debug('Queried record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to query in ' +
                    databases.NotarizedDataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete logged and notarized data by ID'})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.'})
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async deleteLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving DELETE /:id');
        try {
            const res = await this.databaseService.deleteByID(id, databases.NotarizedDataDB);
            this.MyLogger.debug('Deleted record with ID ' + id);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete a document in ' +
                    databases.NotarizedDataDB + 'with this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }
}