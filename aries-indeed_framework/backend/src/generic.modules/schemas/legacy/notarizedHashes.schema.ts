import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const NotarizedHashesSchema = new mongoose.Schema({
    hashedData: { type: String, required: true },
    txReceipt: { type: String, required: true },
    lemma: { type: [], required: true },
});

export interface NotarizedHashes extends mongoose.Document {
    lemma: Object[];
    hashedData: string;
    txReceipt: string;
}
