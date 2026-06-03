import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export const cacheSet = async (key: string, value: any, ttl = 3600) => {
  await redis.setex(key, ttl, JSON.stringify(value))
}

export const cacheGet = async (key: string) => {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

export const cacheDelete = async (key: string) => {
  await redis.del(key)
}

export default redis
