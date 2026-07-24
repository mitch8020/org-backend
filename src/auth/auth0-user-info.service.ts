import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedRequest } from './auth.types';

export interface Auth0Identity {
  email: string;
  emailVerified: boolean;
}

@Injectable()
export class Auth0UserInfoService {
  private readonly userInfoUrl: string;

  constructor(config: ConfigService) {
    this.userInfoUrl = new URL(
      '/userinfo',
      config.getOrThrow<string>('AUTH0_ISSUER_BASE_URL'),
    ).toString();
  }

  async getIdentity(
    request: AuthenticatedRequest,
    expectedSub: string,
  ): Promise<Auth0Identity | undefined> {
    const authorization = request.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('A valid access token is required.');
    }

    let response: Response;
    try {
      response = await fetch(this.userInfoUrl, {
        headers: { Authorization: authorization },
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'The Auth0 member profile is temporarily unavailable.',
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new UnauthorizedException('The Auth0 member profile was rejected.');
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(
        'The Auth0 member profile is temporarily unavailable.',
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ServiceUnavailableException(
        'Auth0 returned an invalid member profile.',
      );
    }

    if (!this.isRecord(payload) || payload.sub !== expectedSub) {
      throw new UnauthorizedException(
        'The Auth0 member profile does not match the access token.',
      );
    }

    if (typeof payload.email !== 'string') return undefined;
    const email = payload.email.trim().toLowerCase();
    if (!email) return undefined;

    return {
      email,
      emailVerified: payload.email_verified === true,
    };
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
