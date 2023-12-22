import * as mongoose from 'mongoose';

/*
Defines the DB Model and interface for preprocessed Data.
*/

export const ConsumerCompilationSchema = new mongoose.Schema({
    timestamp: { type: Number, required: true },
    // wind: { type: Number, required: true },
    wasser: { type: Number, required: true },
    pv: { type: Number, required: true },
    // biogas: { type: Number, required: true },
    // geothermie: { type: Number, required: true },
    graustrom: { type: Object, required: true },
    hashedData: { type: String, required: false },
});

export interface ConsumerCompilation extends mongoose.Document {
    timestamp: number;
    // wind: number;
    wasser: number;
    pv: number;
    // biogas: number;
    // geothermie: number;
    graustrom: number;
    hashedData: string;
    _id: string
}
