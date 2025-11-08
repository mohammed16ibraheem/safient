// Auto-release API endpoint - Automatically releases expired escrow funds to recipients
import { NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { getTransactionByTransferId, getAllTransactions, updateTransaction } from '../../../utils/storage';

// Algorand client setup
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

export async function POST(request: Request) {
  try {
    const { transferId } = await request.json();
    
    if (!transferId) {
      return NextResponse.json({
        success: false,
        error: 'Transfer ID is required'
      }, { status: 400 });
    }
    
    // Find the transaction file (works on Vercel!)
    const result = await getTransactionByTransferId(transferId);
    
    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }
    
    const { transactionFile, transactionData } = result;
    
    if (!transactionData) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }
    
    // FIXED: Check for 'escrowed' status instead of 'pending'
    if (transactionData.status !== 'escrowed') {
      return NextResponse.json({
        success: false,
        error: `Transaction is already ${transactionData.status}`
      }, { status: 400 });
    }
    
    // FIXED: Check timer.expires_at instead of created_at + 30 minutes
    const expiresAt = new Date(transactionData.timer.expires_at);
    const now = new Date();
    
    if (now < expiresAt) {
      const timeRemaining = expiresAt.getTime() - now.getTime();
      const minutesRemaining = Math.ceil(timeRemaining / 60000);
      return NextResponse.json({
        success: false,
        error: `Protection period not expired yet. ${minutesRemaining} minutes remaining.`
      }, { status: 400 });
    }
    
    // Release funds to recipient
    try {
      // Get escrow account
      const escrowAccount = algosdk.mnemonicToSecretKey(transactionData.escrow_mnemonic);
      
      // Get recipient account address
      let recipientAddress: string;
      if (typeof transactionData.recipient_address === 'string') {
        recipientAddress = transactionData.recipient_address;
      } else if (transactionData.recipient_address && transactionData.recipient_address.publicKey) {
        const publicKeyBytes = Object.values(transactionData.recipient_address.publicKey) as number[];
        const publicKeyUint8 = new Uint8Array(publicKeyBytes);
        recipientAddress = algosdk.encodeAddress(publicKeyUint8);
      } else {
        return NextResponse.json({
          success: false,
          error: 'Invalid recipient address format'
        }, { status: 400 });
      }
      
      // Check escrow account balance
      const accountInfo = await algodClient.accountInformation(escrowAccount.addr.toString()).do();
      const escrowBalance = Number(accountInfo.amount || 0);
      
      console.log('💰 [AUTO-RELEASE] Escrow account balance:', escrowBalance);
      
      if (escrowBalance <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Escrow account has no balance'
        }, { status: 400 });
      }
      
      // Get suggested transaction parameters
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      const storedAmount = typeof transactionData.amount === 'string' ? Number(transactionData.amount) : Number(transactionData.amount ?? 0);
      const lockedAmount = typeof transactionData.locked_amount === 'string'
        ? Number(transactionData.locked_amount)
        : Number(transactionData.locked_amount ?? storedAmount);

      if (!Number.isFinite(storedAmount) || storedAmount <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Stored transfer amount is invalid'
        }, { status: 400 });
      }

      // Calculate sendable amount (balance - minimum balance - fee)
      const minimumBalance = 100000; // Algorand minimum balance (0.1 ALGO)
      const txFee = Number(suggestedParams.fee || 1000);
      const maxSendAmount = escrowBalance - minimumBalance - txFee;
      const amountToSend = Math.min(storedAmount, maxSendAmount);
      
      console.log('💰 [AUTO-RELEASE] Balance calculation:', {
        escrowBalance,
        minimumBalance,
        txFee,
        maxSendAmount,
        lockedAmount,
        requestedAmount: storedAmount,
        amountToSend
      });
      
      if (amountToSend <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient balance in escrow after fees and minimum balance'
        }, { status: 400 });
      }
      
      // Create release transaction to recipient
      const releaseTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: escrowAccount.addr,
        receiver: recipientAddress,
        amount: amountToSend,
        suggestedParams,
        note: new Uint8Array(Buffer.from('Safient'))
      });
      
      // Sign and submit transaction
      const signedTxn = releaseTxn.signTxn(escrowAccount.sk);
      const txnResponse = await algodClient.sendRawTransaction(signedTxn).do();
      
      console.log('📡 [AUTO-RELEASE] Transaction submitted:', txnResponse.txid);
      
      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txnResponse.txid, 4);
      
      // Update transaction status
      transactionData.status = 'completed';
      transactionData.release_transaction_hash = txnResponse.txid;
      transactionData.released_at = new Date().toISOString();
      transactionData.auto_released = true; // Mark as auto-released
      
      console.log('✅ [AUTO-RELEASE] Funds released successfully to recipient');
      console.log('💸 [AUTO-RELEASE] Amount sent:', amountToSend, 'microAlgos');
      
      // Save updated transaction (works on Vercel!)
      await updateTransaction(transactionFile, transactionData);
      
      return NextResponse.json({
        success: true,
        data: {
          transactionHash: txnResponse.txid,
          amount: storedAmount,
          status: 'completed'
        }
      });
      
    } catch (error) {
      console.error('❌ [AUTO-RELEASE] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to release funds'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ [AUTO-RELEASE] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to auto-release funds'
    }, { status: 500 });
  }
}

// GET endpoint - Automatically checks ALL expired escrows and releases them
export async function GET() {
  try {
    console.log('🤖 [AUTO-RELEASE-JOB] Starting automatic release check...');
    
    const allTransactions = await getAllTransactions();
    console.log(`📊 [AUTO-RELEASE-JOB] Found ${allTransactions.length} transactions to check`);

    const now = new Date();
    const results = {
      checked: 0,
      expired: 0,
      released: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };

    for (const transaction of allTransactions) {
      try {
        results.checked++;

        // Skip if not escrowed status
        if (transaction.status !== 'escrowed') {
          results.skipped++;
          continue;
        }

        // Check if timer has expired
        if (!transaction.timer || !transaction.timer.expires_at) {
          results.skipped++;
          continue;
        }

        const expiresAt = new Date(transaction.timer.expires_at);
        
        // Skip if not expired yet
        if (now < expiresAt) {
          continue;
        }

        results.expired++;
        console.log(`⏰ [AUTO-RELEASE-JOB] Found expired escrow: ${transaction.transfer_id}`);

        // Attempt to release funds
        try {
          // Get escrow account
          if (!transaction.escrow_mnemonic) {
            throw new Error('Missing escrow mnemonic');
          }

          const escrowAccount = algosdk.mnemonicToSecretKey(transaction.escrow_mnemonic);
          
          // Get recipient address
          let recipientAddress: string;
          if (typeof transaction.recipient_address === 'string') {
            recipientAddress = transaction.recipient_address;
          } else if (transaction.recipient_address && transaction.recipient_address.publicKey) {
            const publicKeyBytes = Object.values(transaction.recipient_address.publicKey) as number[];
            const publicKeyUint8 = new Uint8Array(publicKeyBytes);
            recipientAddress = algosdk.encodeAddress(publicKeyUint8);
          } else {
            throw new Error('Invalid recipient address format');
          }

          // Check escrow account balance
          const accountInfo = await algodClient.accountInformation(escrowAccount.addr.toString()).do();
          const escrowBalance = Number(accountInfo.amount || 0);
          
          if (escrowBalance <= 0) {
            throw new Error('Escrow account has no balance');
          }

          console.log(`💰 [AUTO-RELEASE-JOB] Escrow balance: ${escrowBalance} microAlgos`);

          // Get suggested transaction parameters
          const suggestedParams = await algodClient.getTransactionParams().do();
          
          // Calculate sendable amount (total balance - minimum balance - fee)
          const minimumBalance = 100000; // Algorand minimum balance
          const txFee = Number(suggestedParams.fee || 1000);
          const maxSendAmount = escrowBalance - minimumBalance - txFee;
          const amountToSend = Math.min(transaction.amount, maxSendAmount);

          if (amountToSend <= 0) {
            throw new Error('Insufficient balance after fees and minimum balance');
          }

          // Create release transaction to recipient
          const releaseTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: escrowAccount.addr,
            receiver: recipientAddress,
            amount: amountToSend,
            suggestedParams,
            note: new Uint8Array(Buffer.from('Safient'))
          });
          
          // Sign and submit transaction
          const signedTxn = releaseTxn.signTxn(escrowAccount.sk);
          const txnResponse = await algodClient.sendRawTransaction(signedTxn).do();
          
          console.log(`📡 [AUTO-RELEASE-JOB] Transaction submitted: ${txnResponse.txid}`);
          
          // Wait for confirmation
          await algosdk.waitForConfirmation(algodClient, txnResponse.txid, 4);
          
          // Update transaction status
          transaction.status = 'completed';
          transaction.release_transaction_hash = txnResponse.txid;
          transaction.released_at = new Date().toISOString();
          transaction.auto_released = true; // Mark as auto-released
          
          // Save updated transaction (works on Vercel!)
          await updateTransaction(transaction.transaction_uuid, transaction);
          
          results.released++;
          console.log(`✅ [AUTO-RELEASE-JOB] Successfully released funds for transfer: ${transaction.transfer_id}`);
          console.log(`💸 [AUTO-RELEASE-JOB] ${amountToSend} microAlgos sent from ${escrowAccount.addr} to ${recipientAddress}`);
          
        } catch (releaseError) {
          results.failed++;
          const errorMsg = `Failed to release ${transaction.transfer_id}: ${releaseError instanceof Error ? releaseError.message : 'Unknown error'}`;
          results.errors.push(errorMsg);
          console.error(`❌ [AUTO-RELEASE-JOB] ${errorMsg}`);
        }

      } catch (error) {
        console.error(`❌ [AUTO-RELEASE-JOB] Error processing transaction ${transaction.transaction_uuid}:`, error);
        results.errors.push(`Error processing ${transaction.transaction_uuid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('📊 [AUTO-RELEASE-JOB] Summary:', results);

    return NextResponse.json({
      success: true,
      message: 'Auto-release job completed',
      results: {
        checked: results.checked,
        expired: results.expired,
        released: results.released,
        failed: results.failed,
        skipped: results.skipped,
        errors: results.errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [AUTO-RELEASE-JOB] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Fatal error in auto-release job'
    }, { status: 500 });
  }
}