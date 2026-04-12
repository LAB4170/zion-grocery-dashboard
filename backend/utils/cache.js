const { client } = require('../config/redis');

/**
 * Cache Business Identity
 * @param {string} email 
 * @param {object} business 
 * @param {number} ttl Defaults to 1 hour (3600 seconds)
 */
const cacheBusinessResult = async (email, business, ttl = 3600) => {
  try {
    if (!client.isOpen) await client.connect();
    await client.set(`business_context:${email}`, JSON.stringify(business), {
      EX: ttl
    });
  } catch (err) {
    console.error('Redis Cache Set Error:', err.message);
  }
};

/**
 * Get Cached Business
 * @param {string} email 
 */
const getCachedBusiness = async (email) => {
  try {
    if (!client.isOpen) await client.connect();
    const data = await client.get(`business_context:${email}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis Cache Get Error:', err.message);
    return null;
  }
};

/**
 * Invalidate Cache
 * @param {string} email 
 */
const invalidateBusinessCache = async (email) => {
  try {
    if (!client.isOpen) await client.connect();
    await client.del(`business_context:${email}`);
  } catch (err) {
    console.error('Redis Cache Delete Error:', err.message);
  }
};

module.exports = {
  cacheBusinessResult,
  getCachedBusiness,
  invalidateBusinessCache
};
