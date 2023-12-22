import {Body, Controller, Get, Post, Query, UseGuards,} from '@nestjs/common';
import {ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation,} from '@nestjs/swagger';
import {ChatDto} from 'src/specific.modules/chat/chat.dto';
import {ChatStore} from 'src/specific.modules/chat/chat.store';
import {ConsumerfrontendService} from './consumerfrontend.service';
import {MyLogger} from 'src/generic.modules/logger/logger.service';
import {JwtAuthGuard} from "../authentication/guards/jwt-auth.guard";
import {DatabaseService} from "../../generic.modules/database/database.service";
import {databases} from 'src/generic.modules/database/db.enum';
import {Public} from "../authentication/decorators/puplic.decorator";
import {APIKEYAuthGuard} from "../authentication/guards/apikey-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller('consumerfrontend')
export class ConsumerfrontendController {
    constructor(
        private readonly ConsumerfrontendService: ConsumerfrontendService,
        private DatabaseService: DatabaseService,
        private MyLogger: MyLogger,
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    @Get()
    @ApiOperation({summary: 'Find all Chat messages'})
    @ApiOkResponse({description: 'Returned if Chat message could be found', type: [ChatStore]})
    getAllChatMessages() {
        this.MyLogger.info("Serving GET /");
        return this.ConsumerfrontendService.getPreparedConsumptionData();
    }

    @Get('consumptionData')
    async getConsumptionData() {
        this.MyLogger.info("Serving GET /consumptionData");
        const result = await this.ConsumerfrontendService.getPreparedConsumptionData();
        if(!result) return {};
        return result;
    }

    @Get('localConsumptionData')
    async getLocalConsumptionData() {
        this.MyLogger.info("Serving GET /localConsumptionData");
        return await this.ConsumerfrontendService.getPreparedLocalConsumptionData();
    }

    @Get('compilationData')
    async getCompilationData(@Query() query) {
        this.MyLogger.info('serving /compilationData');
        const result = await this.ConsumerfrontendService.getPreparedCompilationData(query);
        if(!result) return {};
        return result;
    }

    @Get('averageCompilationData')
    async getAverageCompilationData() {
        this.MyLogger.info("Serving GET /averageCompilationData");
        const result = await this.ConsumerfrontendService.getPreparedAverageCompilationData();
        if(!result) return {};
        return result;
    }

    @Post('prioritizationData')
    async sendPrioritizationData(@Body() completeBody) {
        this.MyLogger.info("Serving POST /prioritizationData");
        const result = await this.ConsumerfrontendService.sendPrioritizationData(completeBody);
        if(!result) return {};
        return result;
    }

    @Get('prioritizationData')
    async getPrioritizationData() {
        this.MyLogger.info("Serving GET /prioritizationData");
        const result = await this.ConsumerfrontendService.getPrioritizationData();
        if(!result) return {};
        return result;
    }

    // TODO: Add Cronjob -- use to update forecastParam every day at 00:05 h
    // @Cron('0 5 0/24 * * *')
    @Get('footprintParam')
    async updateForecastParam() {
        this.MyLogger.log("Serving GET /updateFootprintParam");
        return await this.ConsumerfrontendService.updateFootprintParam();
    }

    // TODO: Add Cronjob  - use to update forecastParam every hour
    // @Cron('0 0 0-23/1 * * *')
    @Get('forecast')
    async startForecast() {
        this.MyLogger.log("Serving GET /forecast");
        return await this.ConsumerfrontendService.startForecast();
    }

    // TODO check if only param necessary --> merge the two functions
    @Get('forecastData')
    async getForecastData() {
        this.MyLogger.info("Serving GET /forecastData");
        return await this.ConsumerfrontendService.getForecastData();
    }

    // TODO: Add Cronjob  - use to update forecastParam every hour
    // @Cron('0 0 0-23/1 * * *')
    @Get('createFootprintData')
    async createFootprintData() {
        this.MyLogger.log("Serving GET /createFootprintData");
        return await this.ConsumerfrontendService.createFootprintData();
    }

    @Get('footprintData')
    async getFootprintData() {
        this.MyLogger.info("Serving GET /footprintData");
        return await this.ConsumerfrontendService.getFootprintData();
    }

    @Post('vzpush')
    @Public()
    @UseGuards(APIKEYAuthGuard)
    @ApiOperation({summary: 'Push and process vzlogger data'})
    @ApiBody({type: ChatDto, description: 'VZLogger Data'})
    @ApiCreatedResponse({description: 'Returned if Chat message was successfully sent'})
    @ApiBadRequestResponse({description: 'Returned if the request was malformed'})
    async processVZPush(@Body() completeBody) {
        this.MyLogger.log("Serving POST /vzpush");
        return await this.ConsumerfrontendService.processVZLoggerData(completeBody);
    }

    @Get('originData')
    async getOriginData() {
        this.MyLogger.info("Serving GET /originData");
        return await this.ConsumerfrontendService.getOriginData();
    }

    @Get('location')
    async getLocation() {
        this.MyLogger.info("Serving GET /location");
        return await this.ConsumerfrontendService.getLocation();
    }


    @Get('ConsumerFootprintDBIDs')
    async  getConsumerFootprintDBIDs(){
        this.MyLogger.log("GET ConsumerFootprintDB IDs");
        return  await this.DatabaseService.getAllIDs(databases.ConsumerFootprintDB);
    }

    @Get('labeledConsumerAggregationDBIDs')
    async labeledConsumerAggregationDBIDS(){
        this.MyLogger.log("GET labeledConsumerAggregationDBIDs")
        return await this.DatabaseService.getAllIDs(databases.ConsumerConsumptionDB);
    }

    @Post('labeledConsumerAggregationDB')
    @ApiBody({type: Object, description: 'labeledConsumerAggregation data'})
    async labeledConsumerAggregationDB(@Body() completeBody: Object) {
        this.MyLogger.log("POST labeledConsumerAggregationDB")
        await this.DatabaseService.saveOne(completeBody,databases.labeledConsumerAggregationDB)
    }

}
