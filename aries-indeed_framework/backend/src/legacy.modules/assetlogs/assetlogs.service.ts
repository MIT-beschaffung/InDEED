// import { Model } from 'mongoose';
// import { Injectable, NotFoundException, Inject } from '@nestjs/common';

// import { Assetlog } from './assetlog.model';
// import { HttpService } from '@nestjs/common';
// import { ConfigService } from 'src/config.service';
// import { MyLogger } from '../../generic.modules/logger/logger.service';

// // eslint-disable-next-line @typescript-eslint/no-var-requires
// const SHA256 = require('crypto-js/sha256');

// @Injectable()
// export class AssetlogsService {
//     private Assetlogs: Assetlog[] = [];

//     constructor(
//         @Inject('AssetlogModel')
//         private readonly assetlogModel: Model<Assetlog>,
//         private httpService: HttpService,
//         private readonly configService: ConfigService,
//         private MyLogger: MyLogger,
//     ) {}

//     public queue_url = this.configService.AccumulatorURL;

//     // eslint-disable-next-line @typescript-eslint/ban-types
//     async insertAssetlog(assetlog: {}) {
//         const timestamp = new Date(Date.now()).toString();
//         // eslint-disable-next-line @typescript-eslint/ban-types
//         const temp: {} = {
//             timestamp: timestamp,
//             assetlog: assetlog,
//         };
//         this.MyLogger.debug(JSON.stringify(temp));
//         const result_hashed: string = SHA256(JSON.stringify(temp)).toString();
//         this.MyLogger.debug(result_hashed);

//         const newAssetlog = new this.assetlogModel({
//             timestamp,
//             assetlog,
//             hashedAssetlog: result_hashed,
//         });

//         const result = await newAssetlog.save();
//         const ownAddress: string =
//             'http://localhost:' +
//             this.configService.socketEndpointPort +
//             '/assetlogs';

//         const job = {
//             id: result.id,
//             hashedAssetlog: result_hashed,
//             senderURL: ownAddress,
//         };
//         return job;
//     }
//     //Gets an object an sends it to the Merkletree Builder
//     // eslint-disable-next-line @typescript-eslint/ban-types
//     async sendtoBuilder(job: {}) {
//         this.MyLogger.debug(job);
//         await this.httpService.post(this.queue_url, job).toPromise();
//     }

//     async getAllAssetlogs() {
//         const Assetlogs = await this.assetlogModel.find().exec();
//         return Assetlogs.map((assetlog) => ({
//             _id: assetlog.id,
//             timestamp: assetlog.timestamp,
//             assetlog: assetlog.assetlog,
//         })) as Assetlog[];
//     }

//     async getSingelAssetlog(assetlogid: string) {
//         const assetlog = await this.findAssetlog(assetlogid);
//         return { assetlog };
//     }

//     async updateAssetlog(completeBody) {
//         const assetlogid = completeBody['id'];
//         const updatedassetlog = await this.findAssetlog(assetlogid);
//         if (completeBody['timestamp']) {
//             updatedassetlog.timestamp = completeBody['timestamp'];
//         }
//         if (completeBody['assetlog']) {
//             updatedassetlog.assetlog = completeBody['assetlog'];
//         }
//         if (completeBody['hashedAssetlog']) {
//             updatedassetlog.hashedAssetlog = completeBody['hashedAssetlog'];
//         }
//         if (completeBody['root_id']) {
//             updatedassetlog.root_id = completeBody['root_id'];
//         }
//         if (completeBody['proof']) {
//             updatedassetlog.proof = completeBody['proof'];
//         }
//         updatedassetlog.save();
//     }

//     async deleteAssetlog(assetlogid: string) {
//         const result = await this.assetlogModel
//             .deleteOne({ _id: assetlogid })
//             .exec();
//         if (result.n === 0) {
//             throw new NotFoundException('Could not find assetlog');
//         }
//     }

//     private async findAssetlog(id: string): Promise<Assetlog> {
//         let assetlog;
//         try {
//             assetlog = await this.assetlogModel.findById(id);
//         } catch (error) {
//             throw new NotFoundException('could not find assetlog');
//         }

//         if (!assetlog) {
//             throw new NotFoundException('Could not find assetlog');
//         }
//         return assetlog;
//     }
// }
