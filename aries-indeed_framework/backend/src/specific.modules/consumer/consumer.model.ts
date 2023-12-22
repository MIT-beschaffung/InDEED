import * as mongoose from 'mongoose';

export const ConsumerSchema = new mongoose.Schema({
  logdata: { type: {}, required: true },
  timestamp: { type: String, required: true },
  timestampNumber: { type: Number, required: true },
  hashedLogData: { type: String, required: false },
  root_id: { type: String, required: false },
  proof: { type: [], required: false },
});

export interface ConsumerLogData extends mongoose.Document {
    proof: Object[];
    hashedLogData: string;
    root_id: string;
    _id: string;
    timestamp: string;
    timestampNumber: number;
    logData: object;
}
