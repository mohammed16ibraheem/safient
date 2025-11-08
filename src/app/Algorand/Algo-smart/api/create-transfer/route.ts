import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { CreateSafientAIRequest, CreateSafientAIResponse } from '../../types/safient-ai';
import { validateSafientAIForm } from '../../utils/safient-ai-operations';

// Algorand testnet configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;

// Initialize Algod client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Safient AI contract app ID (will be set after deployment)
const DEFAULT_SAFIENT_AI_APP_ID = 749279083;
const SAFIENT_AI_APP_ID = process.env.SAFIENT_AI_APP_ID ? parseInt(process.env.SAFIENT_AI_APP_ID) : DEFAULT_SAFIENT_AI_APP_ID;

// Add transaction logging
import fs from 'fs';
import path from 'path';

const TRANSACTION_LOG_PATH = path.join(process.cwd(), 'src/app/Algorand/Transaction/safient_ai_transactions.json');

// After successful transaction
const logTransaction = (transactionData: any) => {
  const logData = JSON.parse(fs.readFileSync(TRANSACTION_LOG_PATH, 'utf8'));
  logData.transactions.push({
    transaction_id: transactionData.txId,
    transfer_id: transactionData.transferId,
    type: 'safient_lock',
    amount: transactionData.amount,
    sender: transactionData.sender,
    recipient: transactionData.recipient,
    status: 'pending',
    timestamp: new Date().toISOString(),
    block_round: transactionData.confirmedRound
  });
  fs.writeFileSync(TRANSACTION_LOG_PATH, JSON.stringify(logData, null, 2));
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CreateSafientAIRequest = await request.json();
    
    // Validate request data
    const validation = validateSafientAIForm({
      recipientAddress: body.recipientAddress,
      amount: body.amount.toString(),
      purpose: '', // Optional field
      lockDurationMinutes: body.lockDurationMinutes
    });
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      } as CreateSafientAIResponse, { status: 400 });
    }
    
    // Validate sender mnemonic
    let senderAccount;
    try {
      const senderPrivateKey = algosdk.mnemonicToSecretKey(body.senderMnemonic);
      senderAccount = {
        addr: senderPrivateKey.addr,
        sk: senderPrivateKey.sk
      };
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sender mnemonic'
      } as CreateSafientAIResponse, { status: 400 });
    }
    
    // Check if Safient AI contract is deployed
    if (!SAFIENT_AI_APP_ID) {
      return NextResponse.json({
        success: false,
        error: 'Safient AI contract not deployed. Please contact support.'
      } as CreateSafientAIResponse, { status: 500 });
    }
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Convert amount to microAlgos
    const amountMicroAlgos = Math.round(body.amount * 1_000_000);
    
    // Convert lock duration to seconds
    const lockDurationSeconds = body.lockDurationMinutes * 60;
    
    // Create application call transaction for Safient lock
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: senderAccount.addr,
      appIndex: SAFIENT_AI_APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from('safient_lock')),
        algosdk.encodeUint64(amountMicroAlgos),
        algosdk.encodeUint64(lockDurationSeconds)
      ],
      accounts: [senderAccount.addr, body.recipientAddress],
      suggestedParams,
      note: new Uint8Array(Buffer.from('Safient'))
    });
    
    // Create payment transaction to fund the contract
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: senderAccount.addr,
      receiver: algosdk.getApplicationAddress(SAFIENT_AI_APP_ID),
      amount: amountMicroAlgos,
      suggestedParams,
      note: new Uint8Array(Buffer.from('Safient'))
    });
    
    // Group transactions
    const txnGroup = [paymentTxn, appCallTxn];
    algosdk.assignGroupID(txnGroup);
    
    // Sign transactions
    const signedPaymentTxn = paymentTxn.signTxn(senderAccount.sk);
    const signedAppCallTxn = appCallTxn.signTxn(senderAccount.sk);
    
    // Submit transactions
    const txResponse = await algodClient.sendRawTransaction([
      signedPaymentTxn,
      signedAppCallTxn
    ]).do();
    
    const txId = txResponse.txid;
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    // Calculate expiration time
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = currentTime + lockDurationSeconds;
    
    // Create transfer ID (using transaction ID)
    const transferId = txId;
    
    // Prepare response
    const response: CreateSafientAIResponse = {
      success: true,
      transferId,
      transactionId: txId,
      appId: SAFIENT_AI_APP_ID,
      senderAddress: senderAccount.addr.toString(),
      recipientAddress: body.recipientAddress,
      amount: body.amount,
      lockDurationMinutes: body.lockDurationMinutes,
      expirationTime,
      status: 'active',
      blockRound: Number(confirmedTxn.confirmedRound),
      createdAt: currentTime
    };

    // Persist transaction entry locally for dashboards
    try {
      logTransaction({
        txId,
        transferId,
        amount: amountMicroAlgos,
        sender: senderAccount.addr.toString(),
        recipient: body.recipientAddress,
        confirmedRound: Number(confirmedTxn.confirmedRound)
      });
    } catch (loggingError) {
      console.warn('Failed to log Safient lock transaction:', loggingError);
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Create Safient AI transfer error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as CreateSafientAIResponse, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Safient AI Create Transfer API',
    version: '1.0.0',
    methods: ['POST'],
    description: 'Create a new Safient AI secure transfer'
  });
}