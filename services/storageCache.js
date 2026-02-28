/**
 * AsyncStorage Caching Utility
 * Reduces repeated AsyncStorage calls and optimizes data access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@scola_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class StorageCache {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Get cached item with TTL support
   * @param {string} key - Storage key
   * @param {function} fetchFn - Async function to fetch data if not cached
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>}
   */
  async getOrFetch(key, fetchFn, ttl = CACHE_TTL) {
    const cacheKey = `${CACHE_KEY_PREFIX}${key}`;

    // Check memory cache first
    if (this.memoryCache.has(key)) {
      const cached = this.memoryCache.get(key);
      if (Date.now() - cached.timestamp < ttl) {
        return cached.data;
      }
      this.memoryCache.delete(key);
    }

    try {
      // Check AsyncStorage
      const stored = await AsyncStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < ttl) {
          // Update memory cache
          this.memoryCache.set(key, { data: parsed.data, timestamp: parsed.timestamp });
          return parsed.data;
        }
        // TTL expired, remove from AsyncStorage
        await AsyncStorage.removeItem(cacheKey);
      }

      // Fetch fresh data
      const data = await fetchFn();
      
      // Store in both caches
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      
      this.memoryCache.set(key, cacheData);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      return data;
    } catch (error) {
      console.warn(`Cache error for key ${key}:`, error);
      // If cache fails, try to fetch fresh data
      try {
        return await fetchFn();
      } catch (fetchError) {
        console.error(`Fetch error for key ${key}:`, fetchError);
        throw fetchError;
      }
    }
  }

  /**
   * Set cache manually
   */
  async set(key, data) {
    const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    
    this.memoryCache.set(key, cacheData);
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
  }

  /**
   * Clear specific cache
   */
  async clear(key) {
    const cacheKey = `${CACHE_KEY_PREFIX}${key}`;
    this.memoryCache.delete(key);
    await AsyncStorage.removeItem(cacheKey);
  }

  /**
   * Clear all caches
   */
  async clearAll() {
    this.memoryCache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  /**
   * Get memory cache only (instant, no AsyncStorage)
   */
  getSync(key) {
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  }
}

export default new StorageCache();
