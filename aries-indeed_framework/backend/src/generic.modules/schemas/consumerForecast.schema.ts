import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const ConsumerForecastSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    forecast: { type: Object, required: true },
    hashedData: { type: String, required: false },
});

export interface ConsumerForecast extends mongoose.Document {
    timestamp: number;
    forecast: Object;
    hashedData: string;
    _id: string;
}
