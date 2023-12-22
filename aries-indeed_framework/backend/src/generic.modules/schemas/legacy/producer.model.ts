import * as mongoose from 'mongoose';

export const ProducerSchema = new mongoose.Schema({
  logData: { type: {}, required: true },
  timestamp: { type: String, required: true },
  timestampNumber: { type: Number, required: true },
  hashedLogData: { type: String, required: false },
  root_id: { type: String, required: false },
  proof: { type: {}, required: false },
});

export interface ProducerLogData extends mongoose.Document {
  proof: object;
  hashedLogData: string;
  root_id: string;
  _id: string;
  timestamp: string;
  timestampNumber: number;
  logData: object;
}
