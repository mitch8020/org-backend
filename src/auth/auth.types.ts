import type { Request } from 'express';
import type { AuthResult } from 'express-oauth2-jwt-bearer';

export interface AuthenticatedRequest extends Request {
  auth?: AuthResult;
}
