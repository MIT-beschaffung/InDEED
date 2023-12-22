import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {HydratedDocument, Document} from "mongoose";
import { v4 } from 'uuid';
import RolesEnum from '../roles.enum';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User extends Document{
    @Prop({required: true, default: () => v4() })
    _id: string;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    pwd_hash: string;

    @Prop({ required: true })
    url: URL;

    @Prop({default: () => [RolesEnum.USER]})
    roles: string[];

    constructor(id: string, name: string, pwd_hash: string, url: URL, roles: string[]) {
        super();
        this._id = id;
        this.name = name;
        this.pwd_hash = pwd_hash;
        this.url = url;
        this.roles = roles;
    }
}

export const UserSchema = SchemaFactory.createForClass(User);