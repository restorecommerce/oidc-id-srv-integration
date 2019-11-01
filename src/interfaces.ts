import * as Redis from "ioredis";
import * as Koa from "koa";
import { errors } from "oidc-provider";

export class InvalidPasswordGrant extends errors.InvalidGrant {
  constructor(detail: string) {
    super("invalid_password_grant");
    Object.assign(this, { error_description: detail, error_detail: detail });
  }
}

export interface OIDCPasswordGrantTypeConfig {
    provider: any;
    authenticate: AuthenticateFunc;
}

export abstract class Adapter {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public abstract upsert(id: string, payload: any, expiresIn?: number): Promise<any>;

  public abstract find(id: string): Promise<any>;

  public abstract findByUserCode(userCode: string): Promise<any>;

  public abstract findByUid(uid: string): Promise<any>;

  public abstract consume(id: string): Promise<any>;

  public abstract destroy(id: string): Promise<any>;

  public abstract revokeByGrantId(grantId: string): Promise<any>;
}

export interface Claims {
    sub: string;
    [key: string]: any;
}

export interface Account {
  accountId: any;
  claims(use: string, scope: string): Promise<Claims>;
}

export type AuthenticateFunc = (value: string, password: string) => Promise<Account | undefined>;
export type FindAccountFunc = (ctx: Koa.Context, sub: string, token: string) => Promise<Account>;
export type PerformPasswordGrantFunc
    = (ctx: Koa.Context, clientId: string, identifier: string, password: string) => Promise<TokenResponseBody>;
export type afterPasswordGrantHookFunc =
    (account: Account, accessToken: string, idToken: string, jwtMeta: JwtMeta) => void;

export interface Config {
  redisInstance?: Redis.Redis;
  pathPrefix: string;
  clients?: any[];
  jwks?: {};
  authenticate: AuthenticateFunc;
  findAccount: FindAccountFunc;
  afterPasswordGrantHook: afterPasswordGrantHookFunc;
}

export interface JwtMeta {
  iat: number;
  jti: string;
  exp: number;
}

export interface TokenResponseBody {
  access_token?: string;
  id_token?: string;
  expires_at?: string;
  token_type?: string;
  scope?: string;
}
