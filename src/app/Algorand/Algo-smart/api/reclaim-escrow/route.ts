import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { getTransactionByTransferId, updateTransaction } from '../../../utils/storage';

// Enhanced Algorand client configuration with better error handling
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Add network connectivity check function
async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    console.log('🌐 [RECLAIM] Testing network connectivity...');
    const status = await algodClient.status().do();
    console.log('✅ [RECLAIM] Network connected. Current round:', status.lastRound);
    return true;
  } catch (error) {
    console.error('❌ [RECLAIM] Network connectivity failed:', error);
    return false;
  }
}

// Enhanced escrow account verification function
// Fix 2: Cast balance to number (line 47)
async function verifyEscrowAccount(escrowAddress: string): Promise<{ exists: boolean; balance: number; error?: string }> {
  try {
    console.log('🔍 [RECLAIM] Verifying escrow account:', escrowAddress);
    
    // Check if address format is valid
    if (!algosdk.isValidAddress(escrowAddress)) {
      return { exists: false, balance: 0, error: 'Invalid escrow address format' };
    }
    
    // Add delay for proper indexing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const accountInfo = await algodClient.accountInformation(escrowAddress).do();
    const balance = Number(accountInfo.amount || 0);
    
    console.log('💰 [RECLAIM] Escrow account verified:', {
      address: escrowAddress,
      balance: balance,
      exists: true
    });
    
    return { exists: true, balance };
  } catch (error) {
    console.error('❌ [RECLAIM] Escrow account verification failed:', error);
    
    // Check if it's a "account does not exist" error
    if (error instanceof Error && error.message.includes('account does not exist')) {
      return { exists: false, balance: 0, error: 'Escrow account does not exist on the network' };
    }
    
    return { exists: false, balance: 0, error: `Account verification failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}


export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { transferId, senderMnemonic } = await request.json();
    
    console.log('🔄 [RECLAIM] Processing reclaim request for transfer ID:', transferId);
    
    if (!transferId) {
      console.error('❌ [RECLAIM] Missing transfer ID');
      return NextResponse.json({
        success: false,
        error: 'Missing transfer ID'
      }, { status: 400 });
    }
    
    // Find the transaction by transfer ID (works on Vercel!)
    const result = await getTransactionByTransferId(transferId);
    
    if (!result) {
      console.error('❌ [RECLAIM] Transaction not found for transfer ID:', transferId);
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }
    
    const { transactionData, transactionFile } = result;
    
    console.log('📊 [RECLAIM] Transaction status:', transactionData.status);
    console.log('📊 [RECLAIM] Transaction data:', {
      transferId: transactionData.transfer_id,
      amount: transactionData.amount,
      sender: transactionData.sender,
      recipient: transactionData.recipient,
      timestamp: transactionData.timestamp,
      escrowData: transactionData.escrowData
    });
    
    console.log('📄 [RECLAIM] Found transaction file:', transactionFile);
    console.log('📄 [RECLAIM] Transaction data:', {
      status: transactionData.status,
      amount: transactionData.amount,
      timer: transactionData.timer,
      sender_address_type: typeof transactionData.sender_address,
      sender_address_structure: transactionData.sender_address
    });
    
    // Enhanced address extraction and comparison
    let senderAddress: string;
    if (typeof transactionData.sender_address === 'string') {
        senderAddress = transactionData.sender_address;
        console.log('📍 [RECLAIM] Sender address from transaction (string):', senderAddress);
    } else if (transactionData.sender_address && transactionData.sender_address.publicKey) {
        // Convert publicKey bytes to Algorand address
        const publicKeyBytes = Object.values(transactionData.sender_address.publicKey) as number[];
        const publicKeyUint8 = new Uint8Array(publicKeyBytes);
        const addressFromBytes = algosdk.encodeAddress(publicKeyUint8);
        senderAddress = addressFromBytes;
        console.log('📍 [RECLAIM] Sender address converted from publicKey:', senderAddress);
        console.log('📍 [RECLAIM] Original publicKey bytes:', publicKeyBytes);
    } else {
        console.log('❌ [RECLAIM] Unknown sender address format:', typeof transactionData.sender_address, transactionData.sender_address);
        return NextResponse.json(
            { success: false, error: 'Invalid sender address format in transaction data' },
            { status: 400 }
        );
    }
    
    // Get sender account from mnemonic
    const senderAccount = algosdk.mnemonicToSecretKey(senderMnemonic);
    const derivedAddress: string = senderAccount.addr.toString(); // Convert Address to string
    
    console.log('🔍 [RECLAIM] Address comparison:', {
        fromMnemonic: derivedAddress,
        fromTransaction: senderAddress,
        match: derivedAddress === senderAddress
    });
    
    // Compare string addresses directly (both are now strings)
    if (derivedAddress !== senderAddress) {
        console.log('❌ [RECLAIM] Address mismatch - Unauthorized access attempt');
        console.log('❌ [RECLAIM] Expected (from mnemonic):', derivedAddress);
        console.log('❌ [RECLAIM] Got (from transaction):', senderAddress);
        return NextResponse.json(
            { success: false, error: 'Unauthorized: Only sender can reclaim funds' },
            { status: 403 }
        );
    }
    
    console.log('✅ [RECLAIM] Address verification successful');

    // Enhanced timer validation with detailed logging
    const now = new Date();
    
    // Check if expires_at is null and handle it
    if (!transactionData.timer.expires_at) {
        console.log('❌ [RECLAIM] Timer expires_at is null - transaction data corrupted');
        return NextResponse.json(
            { success: false, error: 'Transaction timer data is corrupted. Please contact support.' },
            { status: 400 }
        );
    }
    
    const expiresAt = new Date(transactionData.timer.expires_at);
    const timeRemaining = expiresAt.getTime() - now.getTime();
    const minutesRemaining = Math.round(timeRemaining / (1000 * 60));
    
    console.log('⏰ [RECLAIM] Timer validation:', {
        currentTime: now.toISOString(),
        expirationTime: expiresAt.toISOString(),
        timeRemainingMs: timeRemaining,
        minutesRemaining: minutesRemaining,
        isExpired: timeRemaining <= 0
    });
    
    if (timeRemaining <= 0) {
        console.log('❌ [RECLAIM] Reclaim period has expired');
        return NextResponse.json(
            { success: false, error: `Reclaim period has expired. Expired ${Math.abs(minutesRemaining)} minutes ago.` },
            { status: 400 }
        );
    }

    // Check if already reclaimed
    if (transactionData.status === 'reclaimed') {
      console.log('❌ [RECLAIM] Funds already reclaimed');
      return NextResponse.json({
        success: false,
        error: 'Funds already reclaimed'
      }, { status: 400 });
    }

    // Check if escrow_mnemonic exists
    if (!transactionData.escrow_mnemonic) {
      console.error('❌ [RECLAIM-ESCROW] Missing escrow_mnemonic in transaction file');
      return NextResponse.json({
        success: false,
        error: 'Transaction file is missing escrow credentials. Please contact support.'
      }, { status: 400 });
    }
    
    // Get escrow account
    let escrowAccount;
    try {
      escrowAccount = algosdk.mnemonicToSecretKey(transactionData.escrow_mnemonic);
      console.log('✅ [RECLAIM] Escrow account loaded:', escrowAccount.addr);
    } catch (error) {
      console.log('❌ [RECLAIM] Invalid escrow mnemonic in transaction data');
      return NextResponse.json({
        success: false,
        error: 'Invalid escrow mnemonic in transaction data'
      }, { status: 500 });
    }
    
    const storedAmount = typeof transactionData.amount === 'string' ? Number(transactionData.amount) : Number(transactionData.amount ?? 0);
    const lockedAmount = typeof transactionData.locked_amount === 'string'
      ? Number(transactionData.locked_amount)
      : Number(transactionData.locked_amount ?? storedAmount);

    if (!Number.isFinite(storedAmount) || storedAmount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Stored transfer amount is invalid. Please contact Safient support.'
      }, { status: 400 });
    }
    
    // Around line 200-220
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Check escrow account balance
    let reclaimTxn; // Declare the variable outside the try block
    try {
      // 1. Check Network Connection
      const isNetworkConnected = await checkNetworkConnectivity();
      if (!isNetworkConnected) {
        return NextResponse.json({
          success: false,
          error: 'Unable to connect to Algorand network. Please check your internet connection and try again.',
          troubleshooting: {
            network: 'failed',
            endpoint: ALGOD_SERVER,
            suggestion: 'Verify network connectivity and Algorand node availability'
          }
        }, { status: 503 });
      }
      
      // 2. Verify Escrow Account
      const escrowVerification = await verifyEscrowAccount(escrowAccount.addr.toString());
      if (!escrowVerification.exists) {
        return NextResponse.json({
          success: false,
          error: escrowVerification.error || 'Escrow account verification failed',
          troubleshooting: {
            network: 'connected',
            escrowAccount: 'not_found',
            escrowAddress: escrowAccount.addr,
            suggestion: 'The escrow account may not be funded or may not exist on the current network (testnet)'
          }
        }, { status: 404 });
      }
      
      const escrowBalance = Number(escrowVerification.balance);
      console.log('💰 [RECLAIM] Escrow account balance confirmed:', escrowBalance);
      
      // 3. Enhanced Balance Validation
      if (escrowBalance <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Escrow account has zero balance',
          troubleshooting: {
            network: 'connected',
            escrowAccount: 'found_but_empty',
            escrowAddress: escrowAccount.addr,
            balance: escrowBalance,
            suggestion: 'The escrow account exists but has no funds. It may have been already reclaimed or never funded.'
          }
        }, { status: 400 });
      }
      
      // Get suggested transaction parameters
      const txFee = Number(suggestedParams.fee || 1000);
      
      // Enhanced minimum balance check
      const minimumBalance = 100000; // Algorand minimum balance
      const requiredTotal = minimumBalance + txFee;
      
      if (escrowBalance < requiredTotal) {
        return NextResponse.json({
          success: false,
          error: `Insufficient balance for transaction`,
          troubleshooting: {
            network: 'connected',
            escrowAccount: 'found_but_insufficient',
            escrowAddress: escrowAccount.addr,
            currentBalance: escrowBalance,
            requiredMinimum: requiredTotal,
            breakdown: {
              minimumBalance: minimumBalance,
              transactionFee: txFee,
              total: requiredTotal
            },
            suggestion: 'The escrow account needs more funds to cover the minimum balance requirement and transaction fees.'
          }
        }, { status: 400 });
      }
      
      // Calculate sendable amount
      const maxSendAmount = escrowBalance - minimumBalance - txFee;
      const amountToSend = Math.min(storedAmount, maxSendAmount);
      
      if (amountToSend <= 0) {
        return NextResponse.json({
          success: false,
          error: 'No funds available for reclaim after fees and minimum balance',
          troubleshooting: {
            network: 'connected',
            escrowAccount: 'insufficient_for_reclaim',
            calculation: {
              escrowBalance: escrowBalance,
              minimumBalance: minimumBalance,
              transactionFee: txFee,
              availableForSend: maxSendAmount
            },
            suggestion: 'The escrow account balance is too low to reclaim any funds after accounting for fees and minimum balance.'
          }
        }, { status: 400 });
      }
      
      // Validate sender account
      if (!senderAccount || !senderAccount.addr) {
        return NextResponse.json({
          success: false,
          error: 'Invalid sender account information',
          troubleshooting: {
            network: 'connected',
            escrowAccount: 'valid',
            senderAccount: 'invalid',
            suggestion: 'The sender account information is missing or invalid. Check the mnemonic and account derivation.'
          }
        }, { status: 400 });
      }
      
        console.log('✅ [RECLAIM] All validations passed. Creating transaction:', {
        from: escrowAccount.addr,
        to: senderAccount.addr,
        originalAmount: lockedAmount,
        netAmount: storedAmount,
        adjustedAmount: amountToSend,
        fee: txFee,
        escrowBalance: escrowBalance
      });
      
      // Create reclaim transaction
      reclaimTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: escrowAccount.addr,
        receiver: senderAccount.addr,
        amount: amountToSend,
        suggestedParams,
        note: new Uint8Array(Buffer.from('Safient'))
      });
      
    } catch (error) {
      console.error('❌ [RECLAIM] Enhanced error handling:', error);
      
      // Detailed error analysis
      let errorCategory = 'unknown';
      let suggestion = 'Please try again later';
      
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
          errorCategory = 'network';
          suggestion = 'Check your internet connection and try again. The Algorand network may be temporarily unavailable.';
        } else if (errorMessage.includes('account does not exist')) {
          errorCategory = 'account_not_found';
          suggestion = 'The escrow account does not exist on the network. Verify the account address and ensure it has been funded.';
        } else if (errorMessage.includes('invalid address')) {
          errorCategory = 'invalid_address';
          suggestion = 'The escrow account address format is invalid. Please check the address.';
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'Failed to check escrow account balance',
        troubleshooting: {
          errorCategory: errorCategory,
          originalError: error instanceof Error ? error.message : 'Unknown error',
          escrowAddress: escrowAccount?.addr || 'undefined',
          networkEndpoint: ALGOD_SERVER,
          suggestion: suggestion,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }

    // Only proceed if reclaimTxn was successfully created
    if (!reclaimTxn) {
      console.error('❌ [RECLAIM] Transaction creation failed');
      return NextResponse.json({
        success: false,
        error: 'Failed to create reclaim transaction'
      }, { status: 500 });
    }

    // Sign and submit transaction
    const signedTxn = reclaimTxn.signTxn(escrowAccount.sk);
    const txnResponse = await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log('📡 [RECLAIM] Transaction submitted:', txnResponse.txid);
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txnResponse.txid, 4);
    
    // Update transaction status
    transactionData.status = 'reclaimed';
    transactionData.reclaim_transaction_hash = txnResponse.txid;
    transactionData.reclaimed_at = new Date().toISOString();
    
    // Save updated transaction (works on Vercel!)
    await updateTransaction(transactionFile, transactionData);
    
    console.log('✅ [RECLAIM] Funds successfully reclaimed:', {
      transferId,
      reclaimTxHash: txnResponse.txid,
      amount: storedAmount,
      senderAddress: senderAccount.addr
    });
    
    return NextResponse.json({
      success: true,
      data: {
        transactionHash: txnResponse.txid,
        amount: storedAmount,
        status: 'reclaimed'
      }
    });
    
  } catch (error) {
    console.error('❌ [RECLAIM] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reclaim funds'
    }, { status: 500 });
  }
}