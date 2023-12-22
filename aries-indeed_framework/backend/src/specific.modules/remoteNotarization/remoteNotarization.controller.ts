import {Body, Controller, Delete, Get, Param, Post, UseGuards} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiSecurity,
    ApiTags
} from '@nestjs/swagger';
import {MyLogger} from "../../generic.modules/logger/logger.service";
import {APIKEYAuthGuard} from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import {RemoteNotarizationService} from "./remoteNotarization.service";
import {databases} from "../../generic.modules/database/db.enum";
import {DatabaseService} from "../../generic.modules/database/database.service";
import {RemoteNotarizationProofDto} from "./remoteNotarizationProof.dto"

@ApiTags('remoteNotarization')
@Controller('remoteNotarize')
@UseGuards(APIKEYAuthGuard)
export class RemoteNotarizationController {
    constructor(
        private readonly remoteNotarizationService: RemoteNotarizationService,
        private readonly MyLogger: MyLogger,
        private readonly databaseService: DatabaseService
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Post('registerIDSForRemoteNotarization')
    @ApiOperation({summary: 'Aggregates the logged data and sends the proof to be notarized on the chain'})
    @ApiBody({description: 'id array of logged data to be notarized', type: [String]})
    @ApiSecurity('api_key', ['api_key'])
    async registerIDSForRemoteNotarization(@Body() completeBody) {
        this.MyLogger.info('serving /registerIDSForRemoteNotarization');
        try {
            return this.remoteNotarizationService.registerIDSForRemoteNotarization(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to notarize some IDs: ');
            this.MyLogger.error(error);
        }
    }

    @Get('getCentralNotarizationProof/:id')
    @ApiOperation({summary: 'Retrieves the central notarization proof for the remote-notarization proof ID'})
    @ApiSecurity('api_key', ['api_key'])
    async getCentralNotarizationProof(@Param('id') ids: string[]) {
        this.MyLogger.info('serving /getCentralNotarizationProof');
        try {
            return this.remoteNotarizationService.getCentralNotarizationProof(ids);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to notarize some IDs: ');
            this.MyLogger.error(error);
        }
    }

    @Post('verifyRemoteNotarizationProof')
    @ApiOperation({summary: 'Verifies the remote notarization proof, including the central component'})
    @ApiBody({description: 'id array of logged data to be notarized', type: RemoteNotarizationProofDto})
    @ApiSecurity('api_key', ['api_key'])
    @UseGuards(APIKEYAuthGuard)
    async verifyRemoteNotarizationProof(@Body() completeBody: RemoteNotarizationProofDto) {
        this.MyLogger.info('serving /verifyRemoteNotarizationProof');
        try {
            return this.remoteNotarizationService.verifyRemoteNotarizationProof(completeBody);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to notarize some IDs: ');
            this.MyLogger.error(error);
        }
    }

    @Get()
    @ApiOperation({summary: 'Returns all saved remote-notarization proofs'})
    @ApiOkResponse({description: 'Returned if RemoteNotarizationData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllRemoteNotarizationData() {
        this.MyLogger.info('serving GET /');
        try {
            const result = await this.databaseService.getAllIDs(databases.RemoteNotarizationDataDB);
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                databases.RemoteNotarizationDataDB + '\n' + error);
            return error;
        }
    }

    @Get(':id')
    @ApiOperation({summary: 'Get remote-notarization proof by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getRemoteNotarizationDataById(@Param('id') id: string) {
        this.MyLogger.info('serving GET /:id');
        try {
            const res = await this.databaseService.findByID(id, databases.RemoteNotarizationDataDB);
            this.MyLogger.debug('Queried record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to query in ' +
                databases.RemoteNotarizationDataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete remote-notarization proof by ID'})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.'})
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async deleteRemoteNotarizationDataById(@Param('id') id: string) {
        this.MyLogger.info('serving DELETE /:id');
        try {
            const res = await this.databaseService.deleteByID(id, databases.RemoteNotarizationDataDB,);
            this.MyLogger.debug('Deleted record with ID ' + id);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete a document in ' +
                databases.RemoteNotarizationDataDB + 'with this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }
}