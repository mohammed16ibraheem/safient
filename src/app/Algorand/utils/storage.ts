// Storage utility - Works both locally (development) and on Vercel (production)
// Uses file system in development, Vercel KV (or an in-memory fallback) in production

import fs from 'fs';
import path from 'path';

// Detect environment
const isProduction = process.env.VERCEL === '1';

// Decide if KV is configured
const kvConfigured = Boolean(
  process.env.KV_REST_API_URL &&
  process.env.KV_REST_API_TOKEN
);

// Vercel KV connection (only when configured)
let kv: any = null;
if (isProduction && kvConfigured) {
  try {
    const { kv: vercelKV } = require('@vercel/kv');
    kv = vercelKV;
  } catch (_error) {
    kv = null;
  }
}

// In-memory fallback (used in production when KV is missing)
type MemoryStore = {
  transactions: Map<string, any>;
  transfers: Map<string, string>;
  wallets: Map<string, any>;
};

const memoryStore = (() => {
  if (!isProduction || kv) return null;
  const globalKey = '__SAFIENT_MEMORY_STORE__';
  const globalScope = globalThis as Record<string, any>;
  if (!globalScope[globalKey]) {
    globalScope[globalKey] = {
      transactions: new Map<string, any>(),
      transfers: new Map<string, string>(),
      wallets: new Map<string, any>()
    } as MemoryStore;
  }
  return globalScope[globalKey] as MemoryStore;
})();

// File-system paths for local development
const TRANSACTION_DIR = path.join(process.cwd(), 'src/app/Algorand/Transaction');
const USERDATA_DIR = path.join(process.cwd(), 'src/app/Algorand/userdata');

// Ensure directories exist (development only)
function ensureDirectories() {
  if (isProduction || memoryStore) return;
  if (!fs.existsSync(TRANSACTION_DIR)) {
    fs.mkdirSync(TRANSACTION_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERDATA_DIR)) {
    fs.mkdirSync(USERDATA_DIR, { recursive: true });
  }
}

// Helpers for memory storage cloning
const clone = (value: any) => JSON.parse(JSON.stringify(value));

/**
 * Save transaction data
 */
export async function saveTransaction(transactionUUID: string, data: any): Promise<void> {
  if (kv) {
    await kv.set(`transaction:${transactionUUID}`, JSON.stringify(data));
    await kv.set(`transfer:${data.transfer_id}`, transactionUUID);
    return;
  }
  if (memoryStore) {
    memoryStore.transactions.set(transactionUUID, clone(data));
    if (data.transfer_id) {
      memoryStore.transfers.set(data.transfer_id, transactionUUID);
    }
    return;
  }

  ensureDirectories();
  const filePath = path.join(TRANSACTION_DIR, `${transactionUUID}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Get transaction by UUID
 */
export async function getTransaction(transactionUUID: string): Promise<any | null> {
  if (kv) {
    const data = await kv.get(`transaction:${transactionUUID}`);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  }
  if (memoryStore) {
    const record = memoryStore.transactions.get(transactionUUID);
    return record ? clone(record) : null;
  }

  ensureDirectories();
  const filePath = path.join(TRANSACTION_DIR, `${transactionUUID}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

/**
 * Get transaction by transfer ID
 */
export async function getTransactionByTransferId(transferId: string): Promise<{ transactionFile: string; transactionData: any } | null> {
  if (kv) {
    const transactionUUID = await kv.get(`transfer:${transferId}`);
    if (!transactionUUID) return null;

    const data = await kv.get(`transaction:${transactionUUID}`);
    if (!data) return null;

    const transactionData = typeof data === 'string' ? JSON.parse(data) : data;
    return { transactionFile: transactionUUID, transactionData };
  }
  if (memoryStore) {
    const transactionUUID = memoryStore.transfers.get(transferId);
    if (!transactionUUID) return null;
    const record = memoryStore.transactions.get(transactionUUID);
    if (!record) return null;
    return { transactionFile: transactionUUID, transactionData: clone(record) };
  }

  ensureDirectories();
  const files = fs.readdirSync(TRANSACTION_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(TRANSACTION_DIR, file);
    const transaction = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (transaction.transfer_id === transferId) {
      return { transactionFile: filePath, transactionData: transaction };
    }
  }
  return null;
}

/**
 * Get all transactions
 */
export async function getAllTransactions(): Promise<any[]> {
  if (kv) {
    const keys = await kv.keys('transaction:*');
    const transactions = [];
    for (const key of keys) {
      const data = await kv.get(key);
      if (data) {
        transactions.push(typeof data === 'string' ? JSON.parse(data) : data);
      }
    }
    return transactions;
  }
  if (memoryStore) {
    return Array.from(memoryStore.transactions.values()).map(clone);
  }

  ensureDirectories();
  const files = fs.readdirSync(TRANSACTION_DIR).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const filePath = path.join(TRANSACTION_DIR, file);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  });
}

/**
 * Update transaction data
 */
export async function updateTransaction(identifier: string, data: any): Promise<void> {
  if (kv) {
    const transactionUUID = identifier.includes('.json') ? path.basename(identifier, '.json') : identifier;
    await kv.set(`transaction:${transactionUUID}`, JSON.stringify(data));
    if (data.transfer_id) {
      await kv.set(`transfer:${data.transfer_id}`, transactionUUID);
    }
    return;
  }
  if (memoryStore) {
    const transactionUUID = identifier.includes('.json') ? identifier.replace('.json', '') : identifier;
    memoryStore.transactions.set(transactionUUID, clone(data));
    if (data.transfer_id) {
      memoryStore.transfers.set(data.transfer_id, transactionUUID);
    }
    return;
  }

  const filePath = identifier.endsWith('.json') ? identifier : path.join(TRANSACTION_DIR, `${identifier}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Save wallet data
 */
export async function saveWalletData(walletAddress: string, data: any): Promise<void> {
  if (kv) {
    await kv.set(`wallet:${walletAddress}`, JSON.stringify(data));
    return;
  }
  if (memoryStore) {
    memoryStore.wallets.set(walletAddress, clone(data));
    return;
  }

  ensureDirectories();
  const filePath = path.join(USERDATA_DIR, `${walletAddress}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Get wallet data
 */
export async function getWalletData(walletAddress: string): Promise<any | null> {
  if (kv) {
    const data = await kv.get(`wallet:${walletAddress}`);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  }
  if (memoryStore) {
    const record = memoryStore.wallets.get(walletAddress);
    return record ? clone(record) : null;
  }

  ensureDirectories();
  const filePath = path.join(USERDATA_DIR, `${walletAddress}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return null;
}

/**
 * Check if wallet exists
 */
export async function walletExists(walletAddress: string): Promise<boolean> {
  if (kv) {
    const exists = await kv.exists(`wallet:${walletAddress}`);
    return exists === 1;
  }
  if (memoryStore) {
    return memoryStore.wallets.has(walletAddress);
  }

  ensureDirectories();
  const filePath = path.join(USERDATA_DIR, `${walletAddress}.json`);
  return fs.existsSync(filePath);
}

/**
 * Get all wallet addresses
 */
export async function getAllWalletAddresses(): Promise<string[]> {
  if (kv) {
    const keys = await kv.keys('wallet:*');
    return keys.map((key: string) => key.replace('wallet:', ''));
  }
  if (memoryStore) {
    return Array.from(memoryStore.wallets.keys());
  }

  ensureDirectories();
  const files = fs.readdirSync(USERDATA_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => f.replace('.json', ''));
}

