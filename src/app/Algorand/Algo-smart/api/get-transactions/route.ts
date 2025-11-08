import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { getAllTransactions, updateTransaction } from '../../../utils/storage';

const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Helper function to convert Address object to string
const addressToString = (addressObj: any): string => {
  if (typeof addressObj === 'string') {
    return addressObj;
  }
  if (addressObj && addressObj.publicKey) {
    // Convert publicKey array to Algorand address
    const publicKeyArray = Object.values(addressObj.publicKey) as number[];
    const publicKeyBuffer = Buffer.from(publicKeyArray);
    return algosdk.encodeAddress(publicKeyBuffer);
  }
  return '';
};

const parseAmount = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const maybeAutoRelease = async (rawData: any) => {
  try {
    if (!rawData) return null;
    if (rawData.status !== 'escrowed') return null;
    if (rawData.auto_released) return null;
    if (!rawData.timer || !rawData.timer.expires_at) return null;

    const now = new Date();
    const expiresAt = new Date(rawData.timer.expires_at);
    if (now < expiresAt) {
      return null;
    }

    if (!rawData.escrow_mnemonic) {
      console.warn('⚠️ [AUTO-RELEASE][GET] Missing escrow mnemonic for transfer', rawData.transfer_id);
      return null;
    }

    const escrowAccount = algosdk.mnemonicToSecretKey(rawData.escrow_mnemonic);

    let recipientAddress: string;
    if (typeof rawData.recipient_address === 'string') {
      recipientAddress = rawData.recipient_address;
    } else if (rawData.recipient_address?.publicKey) {
      const publicKeyBytes = Object.values(rawData.recipient_address.publicKey) as number[];
      recipientAddress = algosdk.encodeAddress(new Uint8Array(publicKeyBytes));
    } else {
      console.error('❌ [AUTO-RELEASE][GET] Invalid recipient format for transfer', rawData.transfer_id);
      return null;
    }

    const accountInfo = await algodClient.accountInformation(escrowAccount.addr).do();
    const escrowBalance = Number(accountInfo.amount || 0);

    if (escrowBalance <= 0) {
      console.warn('⚠️ [AUTO-RELEASE][GET] Escrow balance empty for transfer', rawData.transfer_id);
      return null;
    }

    const suggestedParams = await algodClient.getTransactionParams().do();
    const minimumBalance = 100000;
    const txFee = Number(suggestedParams.fee || 1000);
    const spendable = escrowBalance - minimumBalance - txFee;
    const requestedAmount = parseAmount(rawData.amount);
    const amountToSend = spendable > 0 ? Math.min(spendable, requestedAmount) : 0;

    if (amountToSend <= 0) {
      console.warn('⚠️ [AUTO-RELEASE][GET] Escrow lacks spendable balance for transfer', rawData.transfer_id, {
        escrowBalance,
        minimumBalance,
        txFee,
        requestedAmount
      });
      return null;
    }

    const releaseTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: escrowAccount.addr,
      receiver: recipientAddress,
      amount: amountToSend,
      suggestedParams,
      note: new Uint8Array(Buffer.from('Safient'))
    });

    const signedTxn = releaseTxn.signTxn(escrowAccount.sk);
    const txnResponse = await algodClient.sendRawTransaction(signedTxn).do();
    await algosdk.waitForConfirmation(algodClient, txnResponse.txid, 4);

    rawData.status = 'completed';
    rawData.release_transaction_hash = txnResponse.txid;
    rawData.released_at = new Date().toISOString();
    rawData.auto_released = true;

    // Persist the updated transaction
    const identifier = rawData.transaction_uuid || rawData.transfer_id;
    await updateTransaction(identifier, rawData);

    console.log('✅ [AUTO-RELEASE][GET] Auto-released transfer', rawData.transfer_id, txnResponse.txid);

    return rawData;
  } catch (error) {
    console.error('❌ [AUTO-RELEASE][GET] Failed to auto-release transfer', rawData?.transfer_id, error);
    return null;
  }
};

// Process all transactions from storage (works on Vercel!)
const processAllTransactions = async () => {
  console.log('🔍 [GET-TRANSACTIONS] Loading transactions from storage...');
  
  const allTx = await getAllTransactions();
  console.log('📁 [GET-TRANSACTIONS] Found transactions:', allTx.length);
  
  const transactions: any[] = [];
  
  for (const rawDataOriginal of allTx) {
    try {
      let rawData = rawDataOriginal;

      // Attempt automatic release for expired protections
      const autoReleased = await maybeAutoRelease(rawDataOriginal);
      if (autoReleased) {
        rawData = autoReleased;
      }
      
      console.log('📄 [GET-TRANSACTIONS] Processing transaction:', rawData.transaction_uuid);
      
      // Convert address objects to strings
      const senderAddress = addressToString(rawData.sender_address);
      const recipientAddress = rawData.recipient_address;
      const escrowAddress = addressToString(rawData.escrow_address);
      
      // Determine transaction type and status
      const isSafientAI = rawData.purpose === 'escrow_transfer' || rawData.escrow_id;
      const status = rawData.status; // Keep original status (may be updated above)
      
      const lockedAmount = parseAmount(rawData.locked_amount ?? rawData.amount);
      const netAmount = parseAmount(rawData.amount);

      const processedTransaction = {
        transaction_id: rawData.transaction_uuid,
        transfer_id: rawData.transfer_id,
        sender: senderAddress,
        recipient: recipientAddress,
        original_recipient: recipientAddress, // Store original recipient
        recipient_address: recipientAddress,
        amount: netAmount,
        locked_amount: lockedAmount,
        timestamp: rawData.timestamp,
        status: status,
        type: isSafientAI ? 'safient_ai_transfer' : 'regular_transfer',
        transaction_hash: rawData.transaction_hash,
        block_round: rawData.block_round,
        purpose: rawData.purpose,
        auto_released: rawData.auto_released || false, // Include auto-release flag
        release_transaction_hash: rawData.release_transaction_hash, // Include release tx hash
        released_at: rawData.released_at, // Include release timestamp
        reserved_funds: rawData.reserved_funds,
        // Add escrow data for SafientAI transactions
        escrow_data: isSafientAI ? {
          escrow_address: escrowAddress,
          expires_at: rawData.timer?.expires_at,
          created_at: rawData.timer?.created_at || rawData.timestamp,
          duration_hours: rawData.timer?.duration_hours,
          // Can reclaim if status is 'escrowed' and timer hasn't expired
          can_reclaim: status === 'escrowed' && rawData.timer?.expires_at && new Date(rawData.timer.expires_at) > new Date(),
          lock_duration_minutes: (rawData.timer?.duration_hours || 0.5) * 60
        } : undefined
      };
      
      console.log('✅ [GET-TRANSACTIONS] Processed transaction:', {
        id: processedTransaction.transaction_id,
        type: processedTransaction.type,
        status: processedTransaction.status,
        isSafientAI,
        hasEscrowData: !!processedTransaction.escrow_data
      });
      
      transactions.push(processedTransaction);
    } catch (error) {
      console.error('❌ [GET-TRANSACTIONS] Error processing transaction:', rawDataOriginal?.transaction_uuid, error);
    }
  }
  
  console.log('📊 [GET-TRANSACTIONS] Total processed transactions:', transactions.length);
  return transactions;
};

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 [GET-TRANSACTIONS] API called');
    
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('user');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    console.log('📝 [GET-TRANSACTIONS] Request params:', { userAddress, limit });
    
    const allTransactions = await processAllTransactions();
    
    // Filter by user if specified
    let filteredTransactions = allTransactions;
    if (userAddress) {
      filteredTransactions = allTransactions.filter(tx => 
        tx.sender === userAddress || tx.recipient === userAddress
      );
      console.log('🔍 [GET-TRANSACTIONS] Filtered for user:', userAddress, 'Count:', filteredTransactions.length);
    }
    
    // Sort by timestamp (newest first) and limit
    const sortedTransactions = filteredTransactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    console.log('✅ [GET-TRANSACTIONS] Returning transactions:', sortedTransactions.length);
    
    return NextResponse.json({
      success: true,
      transactions: sortedTransactions,
      total: filteredTransactions.length,
      returned: sortedTransactions.length
    });
    
  } catch (error) {
    console.error('❌ [GET-TRANSACTIONS] API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      transactions: []
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'GET method required for transaction retrieval'
  }, { status: 405 });
}