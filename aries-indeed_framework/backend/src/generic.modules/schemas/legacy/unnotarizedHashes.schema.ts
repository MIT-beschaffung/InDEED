import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for  unnotarized hashes. 
*/

export const UnnotarizedHashesSchema = new mongoose.Schema({
    hashedData: { type: String, required: true },
});

export interface UnnotarizedHash extends mongoose.Document {
    hashedData: string;
}
