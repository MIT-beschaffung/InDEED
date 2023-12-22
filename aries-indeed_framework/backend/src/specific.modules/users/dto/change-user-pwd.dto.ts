import {IsNotEmpty, IsString} from "class-validator";

export class ChangeUserPwdDto {

    @IsString()
    @IsNotEmpty()
    old_pwd: string;

    @IsString()
    @IsNotEmpty()
    new_pwd: string;

}