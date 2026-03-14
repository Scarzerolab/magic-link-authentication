import app from './app.ts';
import { connectRedis } from './config/redis.ts';

const PORT = 5000;

async function startServer() {
    try {
        await connectRedis();

        app.listen(PORT, () => {
            console.log(`Server running on port:${PORT}`);
        });

    } catch (error) {
        console.error('Server failed to start', error);
    }
}

startServer();