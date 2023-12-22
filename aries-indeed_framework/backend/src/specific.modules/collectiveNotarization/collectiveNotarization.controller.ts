import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
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
import {MyLogger} from "../../generic.modules/logger/logger.service";
import { APIKEYAuthGuard } from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import {CollectiveNotarizationService} from "./collectiveNotarization.service";
import {databases} from "../../generic.modules/database/db.enum";
import {DatabaseService} from "../../generic.modules/database/database.service";

@ApiTags('collectiveNotarization')
@Controller('collectiveNotarize')
@UseGuards(APIKEYAuthGuard)
export class CollectiveNotarizationController {
    constructor(
        private readonly collectiveNotarizationService: CollectiveNotarizationService,
        private readonly MyLogger: MyLogger,
        private readonly databaseService: DatabaseService
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Post('registerForCollectiveNotarization')
    @ApiOperation({summary: 'Notarize an array of JSON objects through building a Merkle tree and logging its root on the Quorum blockchain'})
    @ApiBody({type: Object, description: 'Object JSON array to be notarized'})
    @ApiResponse({status: 201, description: 'The records have been successfully aggregated.'})
    @ApiSecurity('api_key', ['api_key'])
    async registerForCollectiveNotarization(@Body() completeBody) {
        try {
            return this.collectiveNotarizationService.registerForCollectiveNotarization(completeBody);
        } catch (error) {
            this.MyLogger.error(
                'The following error occurred while trying to notarize some Objects: ',
            );
            this.MyLogger.error(error);
        }
    }

    @Post('collectiveNotarization')
    @ApiOperation({summary: 'Notarize an array of JSON objects through building a Merkle tree and logging its root on the Quorum blockchain'})
    @ApiResponse({status: 201, description: 'The records have been successfully been notarized.'})
    @ApiSecurity('api_key', ['api_key'])
    async notarizeCollectedObjects(@Body() completeBody) {
        try {
            return this.collectiveNotarizationService.notarizeCollectedObjects();
        } catch (error) {
            this.MyLogger.error(
                'The following error occurred while trying to notarize some Objects: ',
            );
            this.MyLogger.error(error);
        }
    }

    @Get()
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently saved documents'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLogData() {
        try {
            const result = await this.databaseService.getAllIDs(
                databases.CollectiveNotarizationDataDB,
            );
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error(
                'The following error occurred while trying to get all ids in this database: ' +
                databases.CollectiveNotarizationDataDB +
                '\n' +
                error,
            );
            return error;
        }
    }
    @Get(':id')
    @ApiOperation({summary: 'Get logged and notarized data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    async getLogDataById(@Param('id') id: string) {
        try {
            const res = await this.databaseService.findByID(
                id,
                databases.CollectiveNotarizationDataDB,
            );
            this.MyLogger.debug('Queried record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error(
                'The following error occurred while trying to query in ' +
                databases.CollectiveNotarizationDataDB +
                'for this id: ' +
                id +
                '\n this is the error statement: ' +
                error,
            );
            return error;
        }
    }
    @Delete(':id')
    @ApiOperation({summary: 'Delete logged and notarized data by ID'})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.'})
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async deleteLogDataById(@Param('id') id: string) {
        try {
            const res = await this.databaseService.deleteByID(
                id,
                databases.CollectiveNotarizationDataDB,
            );
            this.MyLogger.debug('Deleted record with ID ' + id);
            return res;
        } catch (error) {
            this.MyLogger.error(
                'The following error occurred while trying to delete a document in ' +
                databases.CollectiveNotarizationDataDB +
                'with this id: ' +
                id +
                '\n this is the error statement: ' +
                error,
            );
            return error;
        }
    }

}