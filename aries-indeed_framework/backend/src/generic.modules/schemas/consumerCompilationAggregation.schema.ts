import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const ConsumerCompilationAggregationSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    averageConsumption: { type: Object, required: true },
    hashedData: { type: String, required: false },
});

export interface ConsumerCompilationAggregation extends mongoose.Document {
    timestamp: number;
    averageConsumption: Object;
    hashedData: string;
    _id: string;
}
