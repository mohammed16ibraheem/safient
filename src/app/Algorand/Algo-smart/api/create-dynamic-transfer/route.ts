import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { saveTransaction } from '../../../utils/storage';

// Algorand configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;

// Initialize Algod client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Helper function to convert BigInt to string
const convertBigIntToString = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = convertBigIntToString(obj[key]);
    }
    return result;
  }
  
  return obj;
};

// Generate secure random escrow account
const generateSecureEscrowAccount = () => {
  const randomBytes = crypto.randomBytes(32);
  const account = algosdk.generateAccount();
  return {
    addr: account.addr,
    sk: account.sk,
    mnemonic: algosdk.secretKeyToMnemonic(account.sk),
    escrowId: uuidv4() // Changed from crypto.randomUUID()
  };
};

// Secure logging function (removes sensitive data)
const secureLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (data && typeof data === 'object') {
      // Remove sensitive fields
      const sanitized = { ...data };
      delete sanitized.senderMnemonic;
      delete sanitized.sk;
      delete sanitized.mnemonic;
      delete sanitized.privateKey;
      
      // Mask addresses (show only first 6 and last 4 characters)
      if (sanitized.addr) {
        sanitized.addr = `${sanitized.addr.slice(0, 6)}...${sanitized.addr.slice(-4)}`;
      }
      if (sanitized.sender) {
        sanitized.sender = typeof sanitized.sender === 'string' 
          ? `${sanitized.sender.slice(0, 6)}...${sanitized.sender.slice(-4)}`
          : '[MASKED_ADDRESS]';
      }
      
      console.log(message, sanitized);
    } else {
      console.log(message, data);
    }
  }
};

// No longer needed - storage utility handles this

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    secureLog('🚀 [CREATE-DYNAMIC-TRANSFER] Starting new transfer request');
    
    const body = await request.json();
    const { 
      senderMnemonic, 
      recipientAddress, 
      amount, 
      purpose = 'regular_transfer',
      timer = 0.5 // 
    } = body;

    const amountMicroAlgos = typeof amount === 'string' ? Number(amount) : amount;

    if (!Number.isFinite(amountMicroAlgos) || amountMicroAlgos <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be a positive number of microAlgos'
      }, { status: 400 });
    }

    const roundedAmount = Math.floor(amountMicroAlgos);

    // Generate transaction UUID
    const transactionUUID = uuidv4(); // Use uuidv4 instead of crypto.randomUUID()
    const transferId = uuidv4(); // Use uuidv4 instead of crypto.randomUUID()
    
    // Determine transfer type
    const transferType = purpose === 'escrow_transfer' ? 'escrow' : 'regular';
    const escrowDuration = purpose === 'escrow_transfer' ? timer : 0.5; // Changed from 5 to 0.5
    
    secureLog('📝 [CREATE-DYNAMIC-TRANSFER] Request received', {
      transactionUUID,
      recipientAddress,
      amount: roundedAmount,
      transferType,
      escrowDuration,
      purpose
    });

    // Validate inputs
    if (!senderMnemonic || !recipientAddress || !roundedAmount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: senderMnemonic, recipientAddress, amount'
      }, { status: 400 });
    }

    // Validate and create sender account
    secureLog('🔐 [CREATE-DYNAMIC-TRANSFER] Validating sender credentials...');
    let senderAccount;
    try {
      senderAccount = algosdk.mnemonicToSecretKey(senderMnemonic);
    } catch (error) {
      secureLog('❌ [CREATE-DYNAMIC-TRANSFER] Invalid sender credentials');
      return NextResponse.json({
        success: false,
        error: 'Invalid sender mnemonic'
      }, { status: 400 });
    }

    // Validate recipient address
    if (!algosdk.isValidAddress(recipientAddress)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid recipient address'
      }, { status: 400 });
    }

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Prepare Safient reserve accounting (only applied to escrow transfers)
    const minimumBalanceRequirement = 100000; // 0.1 ALGO
    const suggestedFee = Math.max(Number(suggestedParams.fee || 1000), 1000);

    let minimumBalance = 0;
    let projectedNetworkFee = 0;
    let safientReserve = 0;
    let netTransferAmount = roundedAmount;

    if (purpose === 'escrow_transfer') {
      minimumBalance = minimumBalanceRequirement;
      projectedNetworkFee = suggestedFee;
      safientReserve = minimumBalance + projectedNetworkFee;

      if (roundedAmount <= safientReserve) {
        return NextResponse.json({
          success: false,
          error: 'Amount must exceed Safient reserve (minimum balance + network fee)'
        }, { status: 400 });
      }

      netTransferAmount = roundedAmount - safientReserve;
    }

    let txnHash: string;
    let escrowAccount = null;
    let expiresAt = null;
    
    if (purpose === 'escrow_transfer') {
      // Generate secure escrow account
      escrowAccount = generateSecureEscrowAccount();
      // Set timer duration to 30 minutes (0.5 hours)
      const timerHours = escrowDuration || 0.5; // Default to 30 minutes
      expiresAt = new Date(Date.now() + (timerHours * 60 * 60 * 1000)); // Remove 'const' to use outer variable
      
      console.log('⏰ [CREATE-TRANSFER] Timer set for:', {
          durationHours: timerHours,
          durationMinutes: timerHours * 60,
          expiresAt: expiresAt.toISOString(),
          createdAt: new Date().toISOString()
      });
      
      // Enhanced console logging for SafientAI transfers
      console.log(`\n🛡️ === SAFIENT AI ESCROW CREATED ===`);
      console.log(`📧 Original Recipient: ${recipientAddress}`);
      console.log(`🏦 Escrow Address: ${escrowAccount.addr}`);
      console.log(`💰 Amount funded: ${roundedAmount} microAlgos`);
      console.log(`📉 Safient reserve: ${safientReserve} microAlgos (min ${minimumBalance} + fee ${projectedNetworkFee})`);
      console.log(`🎯 Net deliverable: ${netTransferAmount} microAlgos`);
      console.log(`⏰ Expires: ${expiresAt}`);
      console.log(`🔒 Transfer ID: ${transferId}`);
      console.log(`=====================================\n`);
      
      // Create transaction to escrow account
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAccount.addr,
        receiver: escrowAccount.addr, // Funds go to escrow, not recipient
        amount: roundedAmount,
        note: new Uint8Array(Buffer.from('Safient')),
        suggestedParams: suggestedParams
      });
      
      // Sign and submit transaction
      const signedTxn = txn.signTxn(senderAccount.sk);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      txnHash = response.txid; // FIXED: Use 'txid' instead of 'txId'
      
    } else {
      // Regular transfer
      secureLog('💸 [CREATE-DYNAMIC-TRANSFER] Creating regular transfer');
      
      // FIXED: Create transaction with correct API
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAccount.addr,
        receiver: recipientAddress,
        amount: roundedAmount,
        note: new Uint8Array(Buffer.from('Safient')),
        suggestedParams: suggestedParams
      });
      
      // Sign and submit transaction
      const signedTxn = txn.signTxn(senderAccount.sk);
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      txnHash = response.txid; // FIXED: Use 'txid' instead of 'txId'
    }

    // Wait for confirmation
    secureLog('⏳ [CREATE-DYNAMIC-TRANSFER] Waiting for transaction confirmation...');
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txnHash, 4);
    
    // FIXED: Create transaction record with correct property names
    const transactionRecord = {
      transaction_uuid: transactionUUID,
      transfer_id: transferId,
      sender_address: senderAccount.addr,
      recipient_address: recipientAddress,
      escrow_address: escrowAccount?.addr || null,
      escrow_id: escrowAccount?.escrowId || null,
      escrow_mnemonic: escrowAccount?.mnemonic || null, // ADD THIS LINE
      status: purpose === 'escrow_transfer' ? 'escrowed' : 'completed',
      timestamp: new Date().toISOString(),
      block_round: typeof confirmedTxn.confirmedRound === 'bigint' ? confirmedTxn.confirmedRound.toString() : confirmedTxn.confirmedRound,
      transaction_hash: txnHash,
      amount: netTransferAmount,
      locked_amount: roundedAmount,
      reserved_funds: purpose === 'escrow_transfer' ? {
        minimum_balance: minimumBalance,
        projected_network_fee: projectedNetworkFee,
        safient_reserve: safientReserve
      } : undefined,
      purpose: purpose,
      timer: purpose === 'escrow_transfer' ? {
        duration_hours: timer,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      } : null
    };

    // Save transaction using storage utility (works on Vercel!)
    await saveTransaction(transactionUUID, transactionRecord);
    const savedPath = `Transaction/${transactionUUID}.json`;
    
    secureLog('✅ [CREATE-DYNAMIC-TRANSFER] Transaction completed successfully', {
      transactionUUID,
      transferId,
      txnHash,
      blockRound: confirmedTxn.confirmedRound, // FIXED: Use 'confirmedRound'
      savedPath
    });

    // FIXED: Return success response with correct property structure
    const responseData: any = {
      transaction_uuid: transactionUUID,
      transfer_id: transferId,
      transaction_hash: txnHash,
      block_round: typeof confirmedTxn.confirmedRound === 'bigint' ? confirmedTxn.confirmedRound.toString() : confirmedTxn.confirmedRound,
      sender_address: senderAccount.addr,
      recipient_address: recipientAddress,
      amount: netTransferAmount,
      locked_amount: roundedAmount,
      status: transactionRecord.status,
      purpose: purpose,
      timestamp: transactionRecord.timestamp
    };

    if (purpose === 'escrow_transfer' && escrowAccount) {
      responseData.escrow_address = escrowAccount.addr;
      responseData.escrow_id = escrowAccount.escrowId;
      responseData.expires_at = expiresAt;
      responseData.timer_hours = timer;
    }

    responseData.reserved_funds = purpose === 'escrow_transfer' ? {
      minimum_balance: minimumBalance,
      projected_network_fee: projectedNetworkFee,
      safient_reserve: safientReserve
    } : undefined;

    return NextResponse.json({
      success: true,
      data: responseData
    }, { status: 200 });

  } catch (error) {
    secureLog('💥 [CREATE-DYNAMIC-TRANSFER] Transaction failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Transaction failed'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    console.log('📖 [CREATE-DYNAMIC-TRANSFER] GET request - Reading all transactions...');
    
    const { getAllTransactions: getAllTx } = await import('../../../utils/storage');
    const allTransactions = (await getAllTx()).map(convertBigIntToString);
    console.log('✅ [CREATE-DYNAMIC-TRANSFER] Transactions read successfully, total:', allTransactions.length);
    
    return NextResponse.json({
      success: true,
      data: {
        transactions: allTransactions,
        total_transactions: allTransactions.length,
        last_updated: new Date().toISOString()
      },
      api_info: {
        message: 'Dynamic Transfer API',
        version: '2.0.0',
        methods: ['POST', 'GET'],
        description: 'Create regular or Safient AI protected transfers with UUID-based file storage'
      }
    });
  } catch (error) {
    console.error('💥 [CREATE-DYNAMIC-TRANSFER] Error reading transactions:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read transactions'
    }, { status: 500 });
  }
}