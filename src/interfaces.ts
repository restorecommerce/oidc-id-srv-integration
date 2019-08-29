import * as Redis from "ioredis";
import * as Koa from "koa";
import * as Provider from "oidc-provider";

export class InvalidPasswordGrant extends Provider.errors.InvalidGrant {
  constructor(detail: string) {
    super(400, "invalid_password_grant");
    Object.assign(this, { error_description: detail, error_detail: detail });
  }
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

export interface FindAccount {
  accountId: any;
  claims(): Promise<any>;
}

export interface Config {
  redisInstance: Redis.Redis;
  pathPrefix: string;
  clients?: any[];
  jwks?: {};
  authenticate(credential: string, value: string, password: string): Promise<FindAccount | undefined>;
  findAccount(ctx: Koa.Context, sub: string, token: string): Promise<FindAccount>;
  afterPasswordGrantHook(account: FindAccount, accessToken: string, idToken: string, jwtMeta: JwtMeta): void;
}

export interface JwtMeta {
  iat: number;
  jti: string;
  exp: number;
}

export interface PasswordGrantResponseBody {
  access_token?: string;
  id_token?: string;
  expires_in?: string;
  token_type?: string;
  scope?: string;
}
