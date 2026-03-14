import { createClient } from 'redis';

const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_CLIENT_PASSWORD as string,
    socket: {
        host: process.env.REDIS_CLIENT_SOCKET_HOST as string,
        port: 15444
    }
});

redisClient.on('error', (err) => {
    console.error('Redis client Error', err);
})

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("Redis connected");
  }
}

export default redisClient;