import {Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Req, Res, UseGuards} from '@nestjs/common';
import {Request, Response} from 'express'
import {JwtAuthGuard} from './guards/jwt-auth.guard';
import {LocalAuthGuard} from './guards/local-auth.guard';
import {AuthService} from './auth.service';
import {CreateUserDto} from "../users/dto/create-user.dto";
import {MyLogger} from "../../generic.modules/logger/logger.service";
import {ChangeUserPwdDto} from "../users/dto/change-user-pwd.dto";
import {Roles} from './decorators/roles.decorator';
import RolesEnum from "../users/roles.enum";
import {RolesGuard} from "./guards/roles.guard.js";
import {User} from '../users/schemas/user.schema';
import {PatchUserDto} from "../users/dto/patch-user.dto";

@Controller('authentication')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private MyLogger: MyLogger
    ) {
        this.MyLogger.setContext(this.constructor.name.toString());
    }

    /**
     * This function removes the secret data from the user object before it's returned.
     * The reason why this is handled so late by the controller on the top level,
     * is that the secrets are required in some internal functions.
     *
     * @param user the user object
     * @returns a user object without the secrets
     * @private
     */
    private protectPwdHash(user: User): User {
        delete user.pwd_hash;
        return user;
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @HttpCode(200)
    async login(@Req() req: Request, @Res({passthrough: true}) res: Response) { // req is passed by the AuthGuard
        this.MyLogger.info("serving /login");
        // user field is created by local strategy / guard by using the passport.js package
        // @ts-ignore
        const token = await this.authService.login(req.user);
        // @ts-ignore
        req.user = this.protectPwdHash(req.user);
        res.cookie('InDEED_JWT', token,{
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7d in milliseconds
            sameSite: 'strict',
            secure: true,
            domain: 'indeed-energy.de',
            path: '/',
            httpOnly: true,
        });
        res.send({user: req.user}); // response is returned by send
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout/:id')
    @HttpCode(200)
    async logout(@Param('id') id: string, @Res({passthrough: true}) res: Response) {
        this.MyLogger.info("serving /logout");
        await this.authService.logout(id); // invalidate the old token on serverside
        res.cookie('InDEED_JWT', '', {
            sameSite: 'strict',
            secure: true,
            domain: 'indeed-energy.de',
            path: '/',
            httpOnly: true
        }); // Override the Cookie
        res.send();
    }

    @UseGuards(JwtAuthGuard)
    @Get('credentials')
    async credentials(@Req() req: Request) {
        this.MyLogger.info('serving /credentials');
        req.user = this.protectPwdHash(await this.authService.getUserCredentials(req.user)); // req.user contains the user id after JWT validation
        return {user: req.user};
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolesEnum.ADMIN)
    @Get('user')
    @HttpCode(200)
    async getAllUser() {
        const users = await this.authService.getAllUser()
        return users.map(user => {user.pwd_hash = undefined; return user}) // protectUserPwdHAsh not working
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolesEnum.ADMIN)
    @Put('create')
    @HttpCode(201)
    async create(@Body() createUserDto: CreateUserDto) {
        this.MyLogger.info("serving /create");
        return this.protectPwdHash(await this.authService.create(createUserDto))
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolesEnum.ADMIN)
    @Patch(':id')
    async patch(@Param('id') id: string, @Body() patchUserDto: PatchUserDto) {
        this.MyLogger.info("serving /patch");
        return this.protectPwdHash(await this.authService.patchUser(id, patchUserDto));
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RolesEnum.ADMIN)
    @Delete(':id') // 'delete/:id' isn't working, anyway since we use the Delete-Decorator the route would be redundant
    async delete(@Param('id') id: string) {
        this.MyLogger.info("serving /delete");
        return await this.authService.delete(id);
    }

    @UseGuards(JwtAuthGuard)
    @Put('change/:id')
    async changePwd(@Param('id') id: string, @Body() changeUserPwdDto: ChangeUserPwdDto) {
        this.MyLogger.info("serving /change");
        return this.protectPwdHash(await this.authService.changePwd(id, changeUserPwdDto));
    }
}