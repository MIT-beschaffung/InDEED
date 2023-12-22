import * as mongoose from 'mongoose';
import {ConfigService} from 'src/config.service';
import {databases} from './db.enum';

/*
Establishes the connections for the different models dependent on the assigned role.
Each Connection adds a new collection to the mongodb. Within a collection only documents following a given model can be saved.
This is done in the model.providers.ts file
*/

export const mongooseProviders = [
    {
        provide: databases.LoggedDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.AggregatedDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.NotarizedDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.NotarizedOwnerDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.RemoteNotarizationDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.CollectiveNotarizationDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.LoggedProsumerDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.CommittedProsumerDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.VerifiableProsumerDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.labeledConsumerAggregationDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.RheinenergieDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.SMADataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.SMAprobandenDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.LiqwotecDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.LEWDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.SchweigerDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ffeDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ConsumerConsumptionDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ConsumerAggregationDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ConsumerCompilationDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ConsumerCompilationAggregationDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ConsumerFootprintDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ConsumerFootprintDataDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ConsumerForecastDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.ConsumerPriorizationDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.masterRegistryDB,
        useFactory: (configService: ConfigService) => {
            const connectionurl = configService.localDbURI;
            return mongoose.createConnection(connectionurl);
        },
        inject: [ConfigService],
    },
    {
        provide: databases.usersDB,
        useFactory: () => {
            return mongoose.createConnection('mongodb://dbusers:27022/users')
        }
    }
];
