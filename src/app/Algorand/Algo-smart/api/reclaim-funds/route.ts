import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { ReclaimFundsRequest, ReclaimFundsResponse } from '../../types/safient-ai';

// Algorand testnet configuration
const ALGOD_TOKEN = '';
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;

// Initialize Algod client
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Safient AI contract app ID
const DEFAULT_SAFIENT_AI_APP_ID = 749279083;
const SAFIENT_AI_APP_ID = process.env.SAFIENT_AI_APP_ID ? parseInt(process.env.SAFIENT_AI_APP_ID) : DEFAULT_SAFIENT_AI_APP_ID;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ReclaimFundsRequest = await request.json();
    
    // Validate required fields
    if (!body.senderMnemonic || !body.transferId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: senderMnemonic and transferId'
      } as ReclaimFundsResponse, { status: 400 });
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
      } as ReclaimFundsResponse, { status: 400 });
    }
    
    // Check if Safient AI contract is deployed
    if (!SAFIENT_AI_APP_ID) {
      return NextResponse.json({
        success: false,
        error: 'Safient AI contract not deployed. Please contact support.'
      } as ReclaimFundsResponse, { status: 500 });
    }
    
    // Get contract state to verify transfer exists and is reclaimable
    try {
      const appInfo = await algodClient.getApplicationByID(SAFIENT_AI_APP_ID).do();
      const globalState = appInfo.params.globalState;
      
      // Parse global state
      const stateMap: { [key: string]: any } = {};
      globalState?.forEach((item: any) => {
        const key = Buffer.from(item.key, 'base64').toString();
        let value;
        if (item.value.type === 1) {
          const rawBytes = Buffer.from(item.value.bytes, 'base64');
          if (key === 'safient_sender' || key === 'safient_receiver') {
            value = algosdk.encodeAddress(rawBytes);
          } else {
            value = rawBytes.toString();
          }
        } else {
          value = item.value.uint;
        }
        stateMap[key] = value;
      });
      
      // Check if transfer is active
      if (stateMap['safient_state'] !== 1) { // 1 = ACTIVE
        return NextResponse.json({
          success: false,
          error: 'Transfer is not active or has already been processed'
        } as ReclaimFundsResponse, { status: 400 });
      }
      
      // Check if sender is the original sender
      const contractSender = stateMap['safient_sender'];
      if (contractSender !== senderAccount.addr.toString()) {
        return NextResponse.json({
          success: false,
          error: 'Only the original sender can reclaim funds'
        } as ReclaimFundsResponse, { status: 403 });
      }
      
      // Check if lock period has not expired
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = stateMap['safient_unlocks'];
      
      if (currentTime >= expirationTime) {
        return NextResponse.json({
          success: false,
          error: 'Lock period has expired. Funds can no longer be reclaimed.'
        } as ReclaimFundsResponse, { status: 400 });
      }
      
    } catch (error) {
      console.error('Error checking contract state:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify transfer status'
      } as ReclaimFundsResponse, { status: 500 });
    }
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create application call transaction for Safient return
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: senderAccount.addr,
      appIndex: SAFIENT_AI_APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from('safient_return'))
      ],
      suggestedParams,
      note: new Uint8Array(Buffer.from(`Safient AI Reclaim: ${body.transferId}`))
    });
    
    // Sign transaction
    const signedTxn = appCallTxn.signTxn(senderAccount.sk);
    
    // Submit transaction
    const txResponse = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = txResponse.txid;
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    // Get the amount reclaimed from logs (if available)
    let reclaimedAmount = 0;
    if (confirmedTxn.logs && confirmedTxn.logs.length > 0) {
      // Parse logs to get reclaimed amount
      // This would depend on how the contract logs the reclaimed amount
      // For now, we'll get it from the contract state before reclaim
      try {
        const appInfo = await algodClient.getApplicationByID(SAFIENT_AI_APP_ID).do();
        const globalState = appInfo.params.globalState;
        const stateMap: { [key: string]: any } = {};
        globalState?.forEach((item: any) => {
          const key = Buffer.from(item.key, 'base64').toString();
          let value;
          if (item.value.type === 1) {
            const rawBytes = Buffer.from(item.value.bytes, 'base64');
            if (key === 'safient_sender' || key === 'safient_receiver') {
              value = algosdk.encodeAddress(rawBytes);
            } else {
              value = rawBytes.toString();
            }
          } else {
            value = item.value.uint;
          }
          stateMap[key] = value;
        });
        reclaimedAmount = (stateMap['safient_amount'] || 0) / 1_000_000; // Convert to ALGO
      } catch (error) {
        console.error('Error getting reclaimed amount:', error);
      }
    }
    
    // Prepare response
    const response: ReclaimFundsResponse = {
      success: true,
      transactionId: txId,
      senderAddress: senderAccount.addr.toString(),
      reclaimedAmount,
      blockRound: Number(confirmedTxn.confirmedRound),
      reclaimedAt: Math.floor(Date.now() / 1000)
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Reclaim Safient AI funds error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as ReclaimFundsResponse, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Safient AI Reclaim Funds API',
    version: '1.0.0',
    methods: ['POST'],
    description: 'Reclaim funds from an active Safient AI transfer'
  });
}