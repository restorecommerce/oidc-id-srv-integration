/**
 * The API oidc-provider expects is documented here:
 * https://github.com/panva/node-oidc-provider/blob/master/example/my_adapter.js
 *
 * Example used:
 * https://github.com/panva/node-oidc-provider/blob/master/example/adapters/redis.js
 */
import * as Redis from "ioredis";
import * as _ from "lodash";
import { Adapter } from "./interfaces";

let clientInstance: Redis.Redis;
function setRedisInstance(instance: Redis.Redis) {
    clientInstance = instance;
}

const prefix = "oidc";

function grantKeyFor(id: string) {
  return `${prefix}grant:${id}`;
}

function userCodeKeyFor(userCode: string) {
  return `${prefix}userCode:${userCode}`;
}

function uidKeyFor(uid: string) {
  return `${prefix}uid:${uid}`;
}

const consumable = new Set([
  "AuthorizationCode",
  "RefreshToken",
  "DeviceCode",
]);

class RedisAdapter extends Adapter {

  constructor(name: string) {
    super(name);
    if (!clientInstance) {
      throw Error("Need to call setRedisInstance before using RedisAdapter");
    }
  }

  public async upsert(id: string, payload: any, expiresIn: number) {
    const key = this.key(id);
    const store = consumable.has(this.name)
      ? { payload: JSON.stringify(payload) } : JSON.stringify(payload);

    const multi = clientInstance.multi();
    multi[consumable.has(this.name) ? "hmset" : "set"](key, store);

    if (expiresIn) {
      multi.expire(key, expiresIn);
    }

    if (payload.grantId) {
      const grantKey = grantKeyFor(payload.grantId);
      multi.rpush(grantKey, key);
      const ttl = await clientInstance.ttl(grantKey);
      if (expiresIn > ttl) {
        multi.expire(grantKey, expiresIn);
      }
    }

    if (payload.userCode) {
      const userCodeKey = userCodeKeyFor(payload.userCode);
      multi.set(userCodeKey, id);
      multi.expire(userCodeKey, expiresIn);
    }

    if (payload.uid) {
      const uidKey = uidKeyFor(payload.uid);
      multi.set(uidKey, id);
      multi.expire(uidKey, expiresIn);
    }

    await multi.exec();
  }

  public async find(id: string | null) {
    if (!id) {
      return undefined;
    }
    const data = consumable.has(this.name)
      ? await clientInstance.hgetall(this.key(id))
      : await clientInstance.get(this.key(id));

    if (_.isEmpty(data)) {
      return undefined;
    }

    if (typeof data === "string") {
      return JSON.parse(data);
    }
    const { payload, ...rest } = data;
    return {
      ...rest,
      ...JSON.parse(payload),
    };
  }

  public async findByUid(uid: string) {
    const id = await clientInstance.get(uidKeyFor(uid));
    return this.find(id);
  }

  public async findByUserCode(userCode: string) {
    const id = await clientInstance.get(userCodeKeyFor(userCode));
    return this.find(id);
  }

  public async consume(id: string) {
    await clientInstance.hset(this.key(id), "consumed", Math.floor(Date.now() / 1000));
  }

  public async destroy(id: string) {
    const key = this.key(id);
    await clientInstance.del(key);
  }

  public async revokeByGrantId(grantId: string) {
    const multi = clientInstance.multi();
    const tokens = await clientInstance.lrange(grantKeyFor(grantId), 0, -1);
    tokens.forEach((token: string) => multi.del(token));
    multi.del(grantKeyFor(grantId));
    await multi.exec();
  }

  public key(id: string) {
    return `${prefix}:${this.name}:${id}`;
  }
}

export { RedisAdapter, setRedisInstance };
