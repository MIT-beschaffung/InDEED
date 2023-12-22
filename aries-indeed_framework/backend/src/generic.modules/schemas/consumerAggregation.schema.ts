import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const ConsumerAggregationSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    timestampReadable: { type: String, required: true },
    totalConsumption: { type: Number, required: true },
    averageConsumption: { type: {}, required: true },
    dataHash: { type: String, required: false },
});

export interface ConsumerAggregation extends mongoose.Document {
    timestamp: number;
    timestampReadable: string;
    totalConsumption: number;
    averageConsumption: object;
    dataHash: string;
    _id: string;
}
