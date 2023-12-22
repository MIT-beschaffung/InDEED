import * as mongoose from 'mongoose';

// @ts-ignore
export const labeledConsumerAggregationSchema = new mongoose.Schema({
    localTimeSeries: { type: [[Number]], required: true },
    // id: { type: String, required: true },
});

export interface labeledConsumerAggregation extends mongoose.Document {
    localTimeSeries: number[];
    // _id: string;
}
