import { logger } from './logger';

class MockRedis {
  on(event: string, callback: any) {
    if (event === 'connect') setTimeout(callback, 10);
  }
  async set(): Promise<void> {}
  async setex(): Promise<void> {}
  async get(key?: string): Promise<string | null> { return null; }
  async del(): Promise<void> {}
  async quit(): Promise<void> {}
}

export const redis = new MockRedis() as any;
export const redisPubSub = new MockRedis() as any;

export const cacheSet = async (key: string, value: string, ttlSeconds?: number) => {};
export const cacheGet = async (key: string): Promise<string | null> => { return null; };
export const cacheDel = async (key: string) => {};

process.on('SIGINT', async () => {});
