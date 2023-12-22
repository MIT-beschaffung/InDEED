import * as mongoose from 'mongoose';

export const AssetlogSchema = new mongoose.Schema({
  assetlog: { type: {}, required: true },
  timestamp: { type: String, required: true },
  hashedAssetlog: { type: String, required: false },
  root_id: { type: String, required: false },
  proof: { type: [], required: false },
});

export interface Assetlog extends mongoose.Document {
  proof: Object[];
  hashedAssetlog: string;
  root_id: string;
  _id: string;
  timestamp: string;
  assetlog: object;
}
