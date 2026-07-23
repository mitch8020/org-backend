import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auth } from 'express-oauth2-jwt-bearer';
import type { RequestHandler, Response } from 'express';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class Auth0Guard implements CanActivate {
  private readonly validateAccessToken: RequestHandler;

  constructor(config: ConfigService) {
    this.validateAccessToken = auth({
      audience: config.getOrThrow<string>('AUTH0_AUDIENCE'),
      issuerBaseURL: config.getOrThrow<string>('AUTH0_ISSUER_BASE_URL'),
      tokenSigningAlg: 'RS256',
    });
  }

  canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();

    return new Promise((resolve, reject) => {
      this.validateAccessToken(request, response, (error?: unknown) => {
        if (error) {
          reject(
            new UnauthorizedException('A valid access token is required.'),
          );
          return;
        }

        if (!request.auth?.payload.sub) {
          reject(new UnauthorizedException('The access token has no subject.'));
          return;
        }

        resolve(true);
      });
    });
  }
}

@Injectable()
export class OptionalAuth0Guard implements CanActivate {
  constructor(private readonly auth0Guard: Auth0Guard) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.headers.authorization) return true;
    return this.auth0Guard.canActivate(context);
  }
}
