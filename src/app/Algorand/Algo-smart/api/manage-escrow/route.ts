import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import fs from 'fs';
import path from 'path';

// Updated paths for UUID-based file structure
const TRANSACTION_DIR = path.join(process.cwd(), 'src/app/Algorand/Transaction');
const MASTER_INDEX_PATH = path.join(TRANSACTION_DIR, 'transaction_index.json');

// Find transaction by transfer_id and return UUID
const findTransactionUUID = (transferId: string): string | null => {
  if (!fs.existsSync(MASTER_INDEX_PATH)) {
    return null;
  }
  
  const indexData = JSON.parse(fs.readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const transaction = indexData.transactions.find((tx: any) => tx.transfer_id === transferId);
  
  return transaction ? transaction.transaction_uuid : null;
};

// Load transaction from UUID file
const loadTransaction = (transactionUUID: string): any | null => {
  const transactionFilePath = path.join(TRANSACTION_DIR, `${transactionUUID}.json`);
  
  if (!fs.existsSync(transactionFilePath)) {
    return null;
  }
  
  return JSON.parse(fs.readFileSync(transactionFilePath, 'utf8'));
};

// Save updated transaction
const saveTransaction = (transactionUUID: string, transactionData: any): void => {
  const transactionFilePath = path.join(TRANSACTION_DIR, `${transactionUUID}.json`);
  fs.writeFileSync(transactionFilePath, JSON.stringify(transactionData, null, 2));
  
  // Update master index status
  const indexData = JSON.parse(fs.readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const transactionIndex = indexData.transactions.findIndex(
    (tx: any) => tx.transaction_uuid === transactionUUID
  );
  
  if (transactionIndex !== -1) {
    indexData.transactions[transactionIndex].status = transactionData.status;
    indexData.last_updated = new Date().toISOString();
    fs.writeFileSync(MASTER_INDEX_PATH, JSON.stringify(indexData, null, 2));
  }
};

// Helper function to convert publicKey object to address string
const publicKeyToAddress = (publicKeyObj: any): string => {
  if (typeof publicKeyObj === 'string') {
    return publicKeyObj; // Already a string address
  }
  
  if (publicKeyObj && publicKeyObj.publicKey) {
    // Convert byte object to Uint8Array
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = publicKeyObj.publicKey[i.toString()];
    }
    // Convert to Algorand address
    return algosdk.encodeAddress(bytes);
  }
  
  return publicKeyObj; // Fallback
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { transferId, action, userAddress } = body; // action: 'reclaim' or 'release'

    if (!transferId || !action || !userAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: transferId, action, userAddress'
      }, { status: 400 });
    }

    // Use the fallback function to find transaction by transfer ID
    const result = findTransactionByTransferId(transferId);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Transfer not found'
      }, { status: 404 });
    }

    const { transaction, uuid: transactionUUID } = result;
    
    // Validate user permissions
    if (action === 'reclaim') {
      const senderAddress = publicKeyToAddress(transaction.sender_address);
      if (senderAddress !== userAddress) {
        return NextResponse.json({
          success: false,
          error: 'Only the sender can reclaim funds'
        }, { status: 403 });
      }
    } else if (action === 'release') {
      if (transaction.recipient_address !== userAddress) {
        return NextResponse.json({
          success: false,
          error: 'Only the recipient can release funds'
        }, { status: 403 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Must be "reclaim" or "release"'
      }, { status: 400 });
    }

    // Check if transaction is escrow type
    if (transaction.purpose !== 'escrow_transfer') {
      return NextResponse.json({
        success: false,
        error: 'This is not an escrow transfer'
      }, { status: 400 });
    }

    // Check if already processed
    if (transaction.status === 'reclaimed' || transaction.status === 'released') {
      return NextResponse.json({
        success: false,
        error: `Transfer already ${transaction.status}`
      }, { status: 400 });
    }

    // Check expiration for reclaim
    if (action === 'reclaim' && transaction.timer) {
      const expiresAt = new Date(transaction.timer.expires_at);
      const now = new Date();
      
      if (now > expiresAt) {
        return NextResponse.json({
          success: false,
          error: 'Cannot reclaim - escrow period has expired'
        }, { status: 400 });
      }
    }

    // Update transaction status
    transaction.status = action === 'reclaim' ? 'reclaimed' : 'released';
    transaction.processed_at = new Date().toISOString();
    transaction.processed_by = userAddress;

    // Save updated transaction directly to file
    const transactionFilePath = path.join(TRANSACTION_DIR, `${transactionUUID}.json`);
    fs.writeFileSync(transactionFilePath, JSON.stringify(transaction, null, 2));

    return NextResponse.json({
      success: true,
      message: `Transfer ${action}ed successfully`,
      data: {
        transaction_uuid: transactionUUID,
        transfer_id: transferId,
        action: action,
        status: action === 'reclaim' ? 'reclaimed' : 'released',
        processed_at: new Date().toISOString(),
        processed_by: userAddress,
        file_path: `${transactionUUID}.json`
      }
    });

  } catch (error) {
    console.error('Error in manage-escrow:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    if (!fs.existsSync(MASTER_INDEX_PATH)) {
      return NextResponse.json({ success: false, error: 'Transaction index not found' }, { status: 404 });
    }
    
    const indexData = JSON.parse(fs.readFileSync(MASTER_INDEX_PATH, 'utf8'));
    return NextResponse.json({ 
      success: true, 
      data: indexData,
      message: 'Escrow management API with UUID-based file storage'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to read transaction index' }, { status: 500 });
  }
}

// Updated manage-escrow to work without master index
const findTransactionByTransferId = (transferId: string): any | null => {
  if (!fs.existsSync(TRANSACTION_DIR)) {
    return null;
  }
  
  const files = fs.readdirSync(TRANSACTION_DIR)
    .filter(file => file.endsWith('.json') && file !== 'transaction_index.json');
  
  for (const file of files) {
    const filePath = path.join(TRANSACTION_DIR, file);
    const transaction = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (transaction.transfer_id === transferId) {
      return { transaction, uuid: file.replace('.json', '') };
    }
  }
  
  return null;
};