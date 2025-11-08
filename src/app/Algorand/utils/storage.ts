// Storage utility - Works both locally (development) and on Vercel (production)
// Uses file system in development, Vercel KV in production

import fs from 'fs';
import path from 'path';

// Vercel KV will be used in production
let kv: any = null;
const isProduction = process.env.VERCEL === '1';

// Initialize Vercel KV only in production
if (isProduction) {
  try {
    const { kv: vercelKV } = require('@vercel/kv');
    kv = vercelKV;
    console.log('✅ Using Vercel KV storage (production)');
  } catch (error) {
    console.warn('⚠️ Vercel KV not available, falling back to file system');
  }
}

const TRANSACTION_DIR = path.join(process.cwd(), 'src/app/Algorand/Transaction');
const USERDATA_DIR = path.join(process.cwd(), 'src/app/Algorand/userdata');

// Ensure directories exist (development only)
function ensureDirectories() {
  if (!isProduction) {
    if (!fs.existsSync(TRANSACTION_DIR)) {
      fs.mkdirSync(TRANSACTION_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERDATA_DIR)) {
      fs.mkdirSync(USERDATA_DIR, { recursive: true });
    }
  }
}

/**
 * Save transaction data
 */
export async function saveTransaction(transactionUUID: string, data: any): Promise<void> {
  if (kv) {
    // Production: Use Vercel KV
    await kv.set(`transaction:${transactionUUID}`, JSON.stringify(data));
    await kv.set(`transfer:${data.transfer_id}`, transactionUUID); // Index by transfer_id
  } else {
    // Development: Use file system
    ensureDirectories();
    const filePath = path.join(TRANSACTION_DIR, `${transactionUUID}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

/**
 * Get transaction by UUID
 */
export async function getTransaction(transactionUUID: string): Promise<any | null> {
  if (kv) {
    // Production: Use Vercel KV
    const data = await kv.get(`transaction:${transactionUUID}`);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } else {
    // Development: Use file system
    ensureDirectories();
    const filePath = path.join(TRANSACTION_DIR, `${transactionUUID}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  }
}

/**
 * Get transaction by transfer ID
 */
export async function getTransactionByTransferId(transferId: string): Promise<{ transactionFile: string; transactionData: any } | null> {
  if (kv) {
    // Production: Use Vercel KV
    const transactionUUID = await kv.get(`transfer:${transferId}`);
    if (!transactionUUID) return null;
    
    const data = await kv.get(`transaction:${transactionUUID}`);
    if (!data) return null;
    
    const transactionData = typeof data === 'string' ? JSON.parse(data) : data;
    return { transactionFile: transactionUUID, transactionData };
  } else {
    // Development: Use file system
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
}

/**
 * Get all transactions
 */
export async function getAllTransactions(): Promise<any[]> {
  if (kv) {
    // Production: Use Vercel KV
    const keys = await kv.keys('transaction:*');
    const transactions = [];
    
    for (const key of keys) {
      const data = await kv.get(key);
      if (data) {
        transactions.push(typeof data === 'string' ? JSON.parse(data) : data);
      }
    }
    return transactions;
  } else {
    // Development: Use file system
    ensureDirectories();
    const files = fs.readdirSync(TRANSACTION_DIR).filter(f => f.endsWith('.json'));
    return files.map(file => {
      const filePath = path.join(TRANSACTION_DIR, file);
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    });
  }
}

/**
 * Update transaction data
 */
export async function updateTransaction(identifier: string, data: any): Promise<void> {
  if (kv) {
    // Production: Use Vercel KV
    // identifier can be either UUID or file path
    const transactionUUID = identifier.includes('.json') ? path.basename(identifier, '.json') : identifier;
    await kv.set(`transaction:${transactionUUID}`, JSON.stringify(data));
    if (data.transfer_id) {
      await kv.set(`transfer:${data.transfer_id}`, transactionUUID);
    }
  } else {
    // Development: Use file system
    const filePath = identifier.endsWith('.json') ? identifier : path.join(TRANSACTION_DIR, `${identifier}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

/**
 * Save wallet data
 */
export async function saveWalletData(walletAddress: string, data: any): Promise<void> {
  if (kv) {
    // Production: Use Vercel KV
    await kv.set(`wallet:${walletAddress}`, JSON.stringify(data));
  } else {
    // Development: Use file system
    ensureDirectories();
    const filePath = path.join(USERDATA_DIR, `${walletAddress}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}

/**
 * Get wallet data
 */
export async function getWalletData(walletAddress: string): Promise<any | null> {
  if (kv) {
    // Production: Use Vercel KV
    const data = await kv.get(`wallet:${walletAddress}`);
    return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
  } else {
    // Development: Use file system
    ensureDirectories();
    const filePath = path.join(USERDATA_DIR, `${walletAddress}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return null;
  }
}

/**
 * Check if wallet exists
 */
export async function walletExists(walletAddress: string): Promise<boolean> {
  if (kv) {
    // Production: Use Vercel KV
    const exists = await kv.exists(`wallet:${walletAddress}`);
    return exists === 1;
  } else {
    // Development: Use file system
    ensureDirectories();
    const filePath = path.join(USERDATA_DIR, `${walletAddress}.json`);
    return fs.existsSync(filePath);
  }
}

/**
 * Get all wallet addresses
 */
export async function getAllWalletAddresses(): Promise<string[]> {
  if (kv) {
    // Production: Use Vercel KV
    const keys = await kv.keys('wallet:*');
    return keys.map((key: string) => key.replace('wallet:', ''));
  } else {
    // Development: Use file system
    ensureDirectories();
    const files = fs.readdirSync(USERDATA_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => f.replace('.json', ''));
  }
}

