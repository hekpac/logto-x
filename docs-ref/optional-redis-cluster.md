# Optional Redis Cluster

**File paths**
- `docker-compose.yml`
- `packages/core/src/caches/index.ts`
- `.github/CONTRIBUTING.md`
- `README.md`

**Key changes**
- New `redis-cluster` service enabled via the "cluster" profile.
- `REDIS_URL` accepts `?cluster=1` to enable cluster mode.
- `RedisClusterCache` automatically used when `cluster` query param is present.
- Updated docs with instructions for running the cluster profile.

**New dependencies / environment variables**
- None.
