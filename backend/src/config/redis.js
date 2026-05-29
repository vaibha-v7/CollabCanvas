import { createClient } from 'redis';

const maskRedisUrl = (url) => {
  if (!url) return 'undefined';
  return url.replace(/:([^@]+)@/, ':***@');
};

export const redisClient = createClient({ url: process.env.REDIS_URL });
export const redisPub    = redisClient.duplicate();
export const redisSub    = redisClient.duplicate();

for (const client of [redisClient, redisPub, redisSub]) {
  client.on('error', err => console.error('Redis error:', err.message));
}

export const connectRedis = async () => {
  const maskedUrl = maskRedisUrl(process.env.REDIS_URL);
  console.log(`Connecting to Redis at ${maskedUrl}`);
  try {
    await redisClient.connect();
    await redisPub.connect();
    await redisSub.connect();
    console.log('Redis connected');
  } catch (err) {
    console.error('Redis connection failed:', err?.message || err);
    throw err;
  }
};
