// import {
//     Body,
//     Controller,
//     Delete,
//     Get,
//     Param,
//     Patch,
//     Post,
//     UseGuards,
// } from '@nestjs/common';
// import {
//     ApiBadRequestResponse,
//     ApiBody,
//     ApiCreatedResponse,
//     ApiOperation,
// } from '@nestjs/swagger';
// import { Roles } from 'src/legacy.modules/guard/roles.decorator';
// import { Role } from 'src/legacy.modules/guard/roles.enum';
// import { RolesGuard } from 'src/legacy.modules/guard/roles.guard';
// import { AssetlogDto } from './assetlog.dto';

// import { AssetlogsService } from './assetlogs.service';
// import { MyLogger } from '../../generic.modules/logger/logger.service';

// @Controller('assetlogs')
// @Roles(Role.OWNER)
// export class AssetlogsController {
//     constructor(private readonly assetlogsService: AssetlogsService, private MyLogger: MyLogger) {}

//     @Get()
//     async getAllAssetlogs() {
//         const assetlogs = await this.assetlogsService.getAllAssetlogs();
//         return assetlogs;
//     }

//     @Get(':id')
//     getAssetlog(@Param('id') assetlogid: string) {
//         return this.assetlogsService.getSingelAssetlog(assetlogid);
//     }

//     @Post()
//     @ApiOperation({
//         summary: 'Create a new Assetlog',
//     })
//     @ApiBody({
//         type: Object,
//         description: 'Logdata that needs to be added',
//     })
//     @ApiCreatedResponse({
//         description: 'Returned if Logdata record was successfully created',
//         type: Object,
//     })
//     @ApiBadRequestResponse({
//         description: 'Returned if the request was malformed',
//     })
//     async addAssetlog(@Body() completeBody: {}) {
//         const assetlog = await this.assetlogsService.insertAssetlog(
//             completeBody,
//         );
//         this.assetlogsService.sendtoBuilder(assetlog);
//     }

//     @Post('test')
//     async test() {
//         return this.MyLogger.debug('This is just for testing');
//     }

//     @Patch()
//     async updateAssetlog(@Body() completebody) {
//         await this.assetlogsService.updateAssetlog(completebody);
//     }

//     @Delete(':id')
//     async deleteAssetlog(@Param('id') assetlogid: string) {
//         await this.assetlogsService.deleteAssetlog(assetlogid);
//         return null;
//     }
// }
