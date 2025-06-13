import { RedisClusterCache } from './index.js';

const url = process.env.REDIS_CLUSTER_URL;

(url ? describe : describe.skip)('RedisClusterCache integration', () => {
  it('should ping successfully', async () => {
    const cache = new RedisClusterCache(new URL(url!));
    await cache.connect();
    const result = await cache['ping']();
    await cache.disconnect();
    expect(result).toBe('PONG');
  });
});

