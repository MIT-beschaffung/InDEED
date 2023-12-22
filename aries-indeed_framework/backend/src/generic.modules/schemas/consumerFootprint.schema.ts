import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const ConsumerFootprintSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    footprint: { type: Object, required: true },
    hashedData: { type: String, required: false },
});

export interface ConsumerFootprint extends mongoose.Document {
    timestamp: number;
    footprint: Object;
    hashedData: string;
    _id: string
}
