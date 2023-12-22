import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const PreprocessedDataSchema = new mongoose.Schema({
    data: { type: {}, required: true },
    timestamp: { type: String, required: true },
    timestampNumber: { type: Number, required: true },
    hashedData: { type: String, required: false },
    txReceipt: { type: String, required: false },
    lemma: { type: [], required: false },
});

export interface PreprocessingData extends mongoose.Document {
    data: object;
    timestamp: string;
    timestampNumber: number;
    lemma: Object[];
    hashedData: string;
    txReceipt: string;
    _id: string;
   
    
}
