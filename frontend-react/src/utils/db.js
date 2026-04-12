import { openDB } from 'idb';

const DB_NAME = 'nexus_pos_db';
const DB_VERSION = 1;

/**
 * Initialize the local database
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for products catalog
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      
      // Store for offline sales queue (Outbox)
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      }

      // Store for businesses/settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
};

/**
 * Products Persistence
 */
export const saveProductsLocal = async (products) => {
  const db = await initDB();
  const tx = db.transaction('products', 'readwrite');
  await tx.store.clear();
  for (const product of products) {
    await tx.store.put(product);
  }
  await tx.done;
};

export const getProductsLocal = async () => {
  const db = await initDB();
  return db.getAll('products');
};

/**
 * Outbox (Offline Sales) Management
 */
export const queueSaleOffline = async (saleData) => {
  const db = await initDB();
  const id = await db.add('outbox', {
    ...saleData,
    offlineAt: new Date().toISOString(),
    isSynced: false
  });
  console.log(`📦 Sale queued in outbox (ID: ${id})`);
  return id;
};

export const getPendingSales = async () => {
  const db = await initDB();
  return db.getAll('outbox');
};

export const removeSaleFromOutbox = async (id) => {
  const db = await initDB();
  await db.delete('outbox', id);
};

export const clearOutbox = async () => {
  const db = await initDB();
  await db.clear('outbox');
};
