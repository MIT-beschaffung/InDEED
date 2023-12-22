import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const ConsumerPriorizationSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    prioValueWind: { type: Number, required: true },
    prioValueWasser: { type: Number, required: true },
    prioValuePhotovoltaik: { type: Number, required: true },
    prioValueBiogas: { type: Number, required: true },
    prioValueGeothermie: { type: Number, required: true },
    hashedData: { type: String, required: false }
});

export interface ConsumerPriorization extends mongoose.Document {
    timestamp: number;
    prioValueWind: number;
    prioValueWasser: number;
    prioValuePhotovoltaik: number;
    prioValueBiogas: number;
    prioValueGeothermie: number;
    hashedData: string;
    _id: string;
}
