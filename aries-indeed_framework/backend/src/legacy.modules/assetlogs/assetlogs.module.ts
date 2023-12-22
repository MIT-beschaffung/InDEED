// import { DynamicModule, HttpModule, Module } from '@nestjs/common';

// import { AssetlogsController } from './assetlogs.controller';
// import { AssetlogsService } from './assetlogs.service';
// import { AssetlogSchema } from './assetlog.model';
// import { modelProviders } from 'src/generic.modules/database/model.providers';
// import { DatabaseModule } from '../../generic.modules/database/database.module';
// import { ConfigService } from 'src/config.service';
// import { ConfigModule } from 'src/config.module';
// import { Roles } from 'src/legacy.modules/guard/roles.decorator';
// import { Role } from 'src/legacy.modules/guard/roles.enum';
// import { MyLoggerModule } from 'src/generic.modules/logger/logger.module';

// // This is the assetlogs Module. Here incoming assetlogs are processed.
// // You can write new assetlogs to the MongoDB / query written assetlogs / delete and patch existing assetlogs.

// @Module({
//     imports: [HttpModule, DatabaseModule, ConfigModule, MyLoggerModule],
//     controllers: [AssetlogsController],
//     providers: [AssetlogsService, ...modelProviders],
// })
// export class AssetlogsModule {}
