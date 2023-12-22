import {Body, Controller, Delete, Get, Param, Post, UseGuards,} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiSecurity,
    ApiTags,
} from '@nestjs/swagger';
import {APIKEYAuthGuard} from 'src/specific.modules/authentication/guards/apikey-auth.guard';
import {LoggeddataService} from 'src/specific.modules/loggedData/loggeddata.service';
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {databases} from 'src/generic.modules/database/db.enum';
import {DatabaseService} from 'src/generic.modules/database/database.service';
import {timeFrameDto} from './timeFrame.dto';

@ApiTags('LEW')
@Controller('lew')
@UseGuards(APIKEYAuthGuard)
export class LEWController {

    constructor(
        private readonly loggedDataService: LoggeddataService,
        private readonly databaseService: DatabaseService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Post('logData')
    @ApiOperation({summary: 'Records new logged data for LEW'})
    @ApiBody({type: Object, description: 'A JSON object representing the data that should be logged',})
    @ApiCreatedResponse({description: 'Returns a logData entry',})
    @ApiBadRequestResponse({description: 'Returns if the request was malformed',})
    @ApiResponse({status: 201, description: 'The record has been successfully created.',})
    @ApiSecurity('api_key', ['api_key'])
    recordLogData(@Body() completeBody) {
        this.MyLogger.info('serving /logData');
        const result = this.loggedDataService.createOne(completeBody, databases.LEWDataDB, 'LEW');
        this.MyLogger.debug('Created new logData record');
        return result;
    }

    @Get()
    @ApiOperation({summary: 'Returns IDs and timestamps of all currently saved documents'})
    @ApiOkResponse({description: 'Returned if LogData could be found'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed',})
    @ApiSecurity('api_key', ['api_key'])
    async getAllLogData() {
        this.MyLogger.info('serving GET /');
        try {
            const result = await this.databaseService.getAllIDs(databases.LEWDataDB);
            this.MyLogger.debug('Returning all IDs in the database');
            return result;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get all ids in this database: ' +
                    databases.LEWDataDB + '\n' + error);
            return error;
        }
    }

    @Get(':id')
    @ApiOperation({summary: 'Get logged data by ID'})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving GET /:id');
        try {
            const res = await this.databaseService.findByID(id, databases.LEWDataDB);
            this.MyLogger.debug('Queried record with ID ' + id + '\n' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get the document with this id: ' +
                    id + 'in this database' + databases.LEWDataDB + '\n' + error);
            return error;
        }
    }

    @Delete(':id')
    @ApiOperation({summary: 'Delete logged data by ID',})
    @ApiResponse({status: 200, description: 'The record has been successfully deleted.',})
    @ApiParam({ name: 'id', type: String })
    @ApiSecurity('api_key', ['api_key'])
    async deleteLogDataById(@Param('id') id: string) {
        this.MyLogger.info('serving DELETE /:id');
        try {
            const res = await this.databaseService.deleteByID(id, databases.LEWDataDB,);
            this.MyLogger.debug('Deleted record with ID ' + id);
            this.MyLogger.debug('This record was found: ' + res);
            return res;
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to delete in ' +
                    databases.LEWDataDB + 'for this id: ' + id + '\n this is the error statement: ' + error);
            return error;
        }
    }

    @Post('findByTimePeriod')
    @ApiOperation({summary: 'Get logged data by Time',})
    @ApiResponse({ status: 200, description: 'The query was successful.' })
    @ApiBody({type: timeFrameDto, description: 'A JSON object of upperbound and lower-bound of the time frame to be queried',})
    @ApiSecurity('api_key', ['api_key'])
    async getLogDataByTime(@Body('upperbound') upperbound: number, @Body('lowerbound') lowerbound:number) {
        this.MyLogger.debug('This was assigned for Upperbound:' + upperbound + '\n' + 'This was assigned for lower-bound:' + lowerbound )
        try {
            return await this.databaseService.findManyByTime(upperbound, lowerbound, databases.LEWDataDB);
        } catch (error) {
            this.MyLogger.error('The following error occurred while trying to get documents within this time period: ' +
                    lowerbound + ' : ' + upperbound + 'in this database' + databases.LEWDataDB + '\n' + error);
            return error;
        }
    }
}
