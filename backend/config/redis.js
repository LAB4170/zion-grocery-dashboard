const { createClient } = require('redis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Main client for cache and general use
const client = createClient({ url: redisUrl });

// Secondary clients for Socket.IO (Must have their own connection)
const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

client.on('error', (err) => console.error('Redis Client Error:', err));
pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));

const initRedis = async () => {
  try {
    if (!client.isOpen) await client.connect();
    if (!pubClient.isOpen) await pubClient.connect();
    if (!subClient.isOpen) await subClient.connect();
    console.log('✅ Redis Cluster (Cache + Pub/Sub) Connected');
  } catch (err) {
    console.error('❌ Redis Initialization Failed:', err.message);
  }
};

module.exports = {
  client,
  pubClient,
  subClient,
  initRedis
};
