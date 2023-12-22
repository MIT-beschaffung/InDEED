import {IsArray, IsOptional, IsString, IsUrl} from "class-validator";

export class PatchUserDto {

    @IsString()
    @IsOptional()
    name: string = undefined;

    @IsString()
    @IsOptional()
    pwd_hash: string = undefined;

    @IsUrl()
    @IsOptional()
    url: URL = undefined;

    @IsArray()
    @IsOptional()
    roles: string[] = undefined;

    constructor(name?: string, hash?: string, url?: URL, roles?: string[]) {
        if (name) this.name = name;
        if (hash) this.pwd_hash = hash;
        if (url) this.url = url;
        if (roles) this.roles = roles;
    }
}