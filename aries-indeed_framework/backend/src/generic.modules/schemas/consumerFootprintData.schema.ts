import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const ConsumerFootprintDataSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    days: { type: Object, required: true },
    hashedData: { type: String, required: false },
    //txReceipt: { type: String, required: true },
    //lemma: { type: [], required: true },
});

export interface ConsumerFootprintData extends mongoose.Document {
    timestamp: number;
    days: Object;
    //lemma: Object[];
    hashedData: string;
    //txReceipt: string;
    _id: string;
}
