import {Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put, UseGuards} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiSecurity,
    ApiTags
} from '@nestjs/swagger';
import {masterDataService} from './masterData.service';
import {DatabaseService} from "../../generic.modules/database/database.service";
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {masterRegistryDto} from './masterRegistryData.dto';
import {databases} from "../../generic.modules/database/db.enum";
import {APIKEYAuthGuard} from "../authentication/guards/apikey-auth.guard";

@ApiTags('Master data Registry')
@Controller('masterData')
@UseGuards(APIKEYAuthGuard)
export class masterDataController {
    constructor(
        private readonly masterDataService: masterDataService,
        private readonly databaseService: DatabaseService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Post('register')
    @ApiOperation({summary: 'Register prosumer masterData with pubKey_x, location (lat/long) and preference (consumer)'})
    @ApiBody({type: masterRegistryDto, description: 'A JSON containing the masterData.'})
    @ApiCreatedResponse({description: 'Returned if masterData was successfully registered'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiSecurity('api_key', ['api_key'])
    async registerData(@Body() completeBody) {
        this.MyLogger.info("Serving POST /masterData/register");
        return await this.masterDataService.registerMasterData(completeBody);
    }

    @Get('registered')
    @ApiOperation({summary: 'Returns IDs of all registered master data sets'})
    @ApiOkResponse({description: 'Returned if no registered data could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    @ApiSecurity('api_key', ['api_key'])
    async getAllRegisteredKeys() {
        this.MyLogger.info('serving /registered');
        try {
            const result = await this.databaseService.getAllIDs(databases.masterRegistryDB);
            this.MyLogger.debug('Returning all IDs representing master data in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                databases.masterRegistryDB + '\n' + error);
            return error;
        }
    }

    @Get('registered:id')
    @ApiOperation({summary: 'Get registered master data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getMasterDataById(@Param('id') id: string) {
        this.MyLogger.info('serving /registered/:id');
        try {
            const res = await this.databaseService.findByID(id, databases.masterRegistryDB);
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: '
                + id + 'in this database' + databases.masterRegistryDB + '\n' + error);
            return error;
        }
    }

    @Get('byKey:prosumerKey')
    @ApiParam({ name: 'prosumerKey', type: String })
    @ApiOperation({summary: 'Get masterData of single prosumer'})
    @ApiCreatedResponse({description: 'Returned if GET masterData was successful'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiSecurity('api_key', ['api_key'])
    async getMasterData(@Param('prosumerKey') prosumerKey: string) {
        this.MyLogger.info("Serving GET /masterData/byKey");
        const result = await this.masterDataService.getMasterData(prosumerKey);

        if (result.length == 1) {
            return result;
        } else if (result.length > 1) {
            throw new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);
        } else {
            throw new HttpException('Not found', HttpStatus.NOT_FOUND);
        }
    }

    /*
        The following is actually a GET method, but there is an unsolved issue that it is impossible to append a body
        on a GET method, therefore it's decorated with POST.
        See, e.g.:
        https://stackoverflow.com/questions/48749252/swagger-typeerror-failed-to-execute-fetch-on-window-request-with-get-head
    */
    @Post('manyByKeys')
    @ApiBody({type: [String], description: 'A string array containing the prosumerKeys.'})
    @ApiOperation({summary: 'GET masterData of many prosumers (POST label due to a swagger issue!)'})
    @ApiCreatedResponse({description: 'Returned if GET masterData was successful'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiSecurity('api_key', ['api_key'])
    async getMasterDataMany(@Body() prosumerKeys: string[]) {
        this.MyLogger.info("Serving GET /masterData/manyByKeys");
        return await this.masterDataService.getMasterDataMany(prosumerKeys);
    }

    @Put('completeBody')
    @ApiBody({type: Object, description: 'A JSON containing the new masterData.'})
    @ApiOperation({summary: 'Put masterData'})
    @ApiCreatedResponse({description: 'Returned if PUT masterData was successful'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiSecurity('api_key', ['api_key'])
    async putMasterData(@Body() completeBody) {
        this.MyLogger.info("Serving PUT /masterData/completeBody");
        return await this.masterDataService.putMasterData(completeBody);
    }

    @Delete()
    @ApiOperation({summary: 'Delete all master data entries'})
    @ApiSecurity('api_key', ['api_key'])
    async deleteAll() {
        this.MyLogger.info("Serving DELETE /masterData");
        return await this.masterDataService.deleteAll();
    }
}