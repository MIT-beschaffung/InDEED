import {Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        return this.matchRoles(roles, user.roles);
    }

    /**
     * Checks if the user has a role that allows access to the endpoint.
     * If the user has no such role, an UnauthorizedException is thrown.
     *
     * @param guard_roles User roles required by the guard
     * @param user_roles The list of user roles
     * @returns true if the user has on role that's part of guard_roles
     * @throws UnauthorizedException If no user role matches a role in guard_roles
     */
    matchRoles(guard_roles: string[], user_roles: string[]): boolean {
        if (guard_roles.some(role => user_roles?.includes(role))) {
            return true;
        }
        throw new UnauthorizedException();
    }
}
