import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class APIKEYAuthGuard extends AuthGuard('api_key') {}