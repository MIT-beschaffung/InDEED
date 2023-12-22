import {Connection} from 'mongoose';

import {databaseModels} from './db.models.enum';
import {dbschemas} from '../schemas/schemas.enum';

import {databases} from './db.enum';
import {LoggedDataSchema} from '../schemas/loggedData.schema';
import {NotarizedDataSchema} from '../schemas/notarizedData.schema';

import {NotarizedOwnerDataSchema} from "../schemas/notarizedOwnerData.schema";
import {RemoteNotarizationDataSchema} from "../schemas/remoteNotarizationData.schema";

import {AggregatedDataSchema} from '../schemas/aggregatedData.schema';
import {
    CommittedProsumerDataSchema,
    LoggedProsumerDataSchema,
    VerifiableProsumerDataSchema,
} from '../schemas/labeledData.schema';

import {labeledConsumerAggregationSchema} from '../schemas/labeledConsumerAggregation.schema';

import {ConsumerConsumptionSchema} from '../schemas/consumerConsumption.schema';
import {ConsumerAggregationSchema} from '../schemas/consumerAggregation.schema';
import {ConsumerCompilationSchema} from '../schemas/consumerCompilation.schema';
import {ConsumerCompilationAggregationSchema} from '../schemas/consumerCompilationAggregation.schema';
import {ConsumerFootprintSchema} from '../schemas/consumerFootprint.schema';
import {ConsumerFootprintDataSchema} from '../schemas/consumerFootprintData.schema';
import {ConsumerForecastSchema} from '../schemas/consumerForecast.schema';
import {ConsumerPriorizationSchema} from '../schemas/consumerPriorization.schema';
import {masterRegistrySchema} from '../schemas/masterRegistry.schema';
import {CollectiveNotarizationDataSchema} from "../schemas/collectiveNotarizationData.schema";
import {UserSchema} from "../../specific.modules/users/schemas/user.schema";

/*
here the separate database models are "linked" to the established db connections.
Only Data fitting to the assigned model can be saved
*/

export const modelProviders = [
    {
        provide: databaseModels.LoggedDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.LoggedData, LoggedDataSchema),
        inject: [databases.LoggedDataDB],
    },
    {
        provide: databaseModels.RheinenergieDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.RheinenergieData, LoggedDataSchema),
        inject: [databases.LoggedDataDB],
    },
    {
        provide: databaseModels.SMADataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.SMAData, LoggedDataSchema),
        inject: [databases.LoggedDataDB],
    },
    {
        provide: databaseModels.LiqwotecDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.LiqwotecData, LoggedDataSchema),
        inject: [databases.LoggedDataDB],
    },
    {
        provide: databaseModels.LEWDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.LEWData, LoggedDataSchema),
        inject: [databases.LoggedDataDB],
    },
    {
        provide: databaseModels.SchweigerDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.SchweigerData, LoggedDataSchema),
        inject: [databases.LoggedDataDB],
    },
    {
        provide: databaseModels.ffeDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.ffeData, LoggedDataSchema),
        inject: [databases.LoggedDataDB],
    },
    {
        provide: databaseModels.AggregatedDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.AggregatedData, AggregatedDataSchema),
        inject: [databases.AggregatedDataDB],
    },
    {
        provide: databaseModels.NotarizedDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.NotarizedData, NotarizedDataSchema),
        inject: [databases.NotarizedDataDB],
    },
    {
        provide: databaseModels.NotarizedOwnerDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.NotarizedOwnerData, NotarizedOwnerDataSchema),
        inject: [databases.NotarizedOwnerDataDB],
    },
    {
        provide: databaseModels.RemoteNotarizationDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.RemoteNotarizationData, RemoteNotarizationDataSchema),
        inject: [databases.RemoteNotarizationDataDB],
    },
    {
        provide: databaseModels.CollectiveNotarizationDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.CollectiveNotarizationData, CollectiveNotarizationDataSchema),
        inject: [databases.CollectiveNotarizationDataDB],
    },
    {
        provide: databaseModels.LoggedProsumerDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.LoggedProsumerData, LoggedProsumerDataSchema),
        inject: [databases.LoggedProsumerDataDB],
    },
    {
        provide: databaseModels.CommittedProsumerDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.CommittedProsumerData, CommittedProsumerDataSchema),
        inject: [databases.CommittedProsumerDataDB],
    },
    {
        provide: databaseModels.VerifiableProsumerDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.VerifiableProsumerData, VerifiableProsumerDataSchema),
        inject: [databases.VerifiableProsumerDataDB],
    },
    {
        provide: databaseModels.labeledConsumerAggregationDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.labeledConsumerAggregation, labeledConsumerAggregationSchema),
        inject: [databases.labeledConsumerAggregationDB],
    },
    {
        provide: databaseModels.ConsumerConsumptionDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.ConsumerConsumption, ConsumerConsumptionSchema),
        inject: [databases.ConsumerConsumptionDB],
    },
    {
        provide: databaseModels.ConsumerAggregationDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.ConsumerAggregation, ConsumerAggregationSchema),
        inject: [databases.ConsumerAggregationDB],
    },
    {
        provide: databaseModels.ConsumerCompilationDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.ConsumerCompilation, ConsumerCompilationSchema),
        inject: [databases.ConsumerCompilationDB],
    },
    {
        provide: databaseModels.ConsumerCompilationAggregationDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.ConsumerCompilationAggregation, ConsumerCompilationAggregationSchema),
        inject: [databases.ConsumerCompilationAggregationDB],
    },
    {
        provide: databaseModels.ConsumerFootprintDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.ConsumerFootprint, ConsumerFootprintSchema),
        inject: [databases.ConsumerFootprintDB],
    },
    {
        provide: databaseModels.ConsumerFootprintDataDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.ConsumerFootprintData, ConsumerFootprintDataSchema),
        inject: [databases.ConsumerFootprintDataDB],
    },
    {
        provide: databaseModels.ConsumerForecastDBModel,
        useFactory: (connection: Connection) =>
            connection.model(dbschemas.ConsumerForecast, ConsumerForecastSchema),
        inject: [databases.ConsumerForecastDB],
    },
    {
        provide: databaseModels.ConsumerPriorizationDBModel,
        useFactory: (connection: Connection) =>
            connection.model(
                dbschemas.ConsumerPriorization,
                ConsumerPriorizationSchema,
            ),
        inject: [databases.ConsumerPriorizationDB],
    },
    {
        provide: databaseModels.masterRegistryDBModel,
        useFactory: (connection: Connection) =>
            connection.model(
                dbschemas.masterRegistry,
                masterRegistrySchema,
            ),
        inject: [databases.masterRegistryDB],
    },
    {
        provide: databaseModels.usersDBModel,
        useFactory: (connection: Connection) => connection.model(dbschemas.user, UserSchema),
        inject: [databases.usersDB]
    }
];
