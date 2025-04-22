import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: any, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }
    return this.redis.set(key, JSON.stringify(value));
  }

  async del(key: string) {
    return this.redis.del(key);
  }

  async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const reply = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = reply[0];
      keys.push(...reply[1]);
    } while (cursor !== '0');

    return keys;
  }

  async delByPattern(pattern: string) {
    const keys = await this.scanKeys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }
}
