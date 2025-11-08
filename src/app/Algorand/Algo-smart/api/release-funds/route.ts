import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { ReleaseFundsRequest, ReleaseFundsResponse } from '../../types/safient-ai';

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
    const body: ReleaseFundsRequest = await request.json();
    
    // Validate required fields
    if (!body.callerMnemonic || !body.transferId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: callerMnemonic and transferId'
      } as ReleaseFundsResponse, { status: 400 });
    }
    
    // Validate caller mnemonic
    let callerAccount;
    try {
      const callerPrivateKey = algosdk.mnemonicToSecretKey(body.callerMnemonic);
      callerAccount = {
        addr: callerPrivateKey.addr,
        sk: callerPrivateKey.sk
      };
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid caller mnemonic'
      } as ReleaseFundsResponse, { status: 400 });
    }
    
    // Check if Safient AI contract is deployed
    if (!SAFIENT_AI_APP_ID) {
      return NextResponse.json({
        success: false,
        error: 'Safient AI contract not deployed. Please contact support.'
      } as ReleaseFundsResponse, { status: 500 });
    }
    
    // Get contract state to verify transfer exists and is releasable
    let contractState: { [key: string]: any } = {};
    try {
      const appInfo = await algodClient.getApplicationByID(SAFIENT_AI_APP_ID).do();
      const globalState = appInfo.params.globalState;
      
      // Parse global state
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
        contractState[key] = value;
      });
      
      // Check if transfer is active
      if (contractState['safient_state'] !== 1) { // 1 = ACTIVE
        return NextResponse.json({
          success: false,
          error: 'Transfer is not active or has already been processed'
        } as ReleaseFundsResponse, { status: 400 });
      }
      
      // Check if lock period has expired
      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = contractState['safient_unlocks'];
      
      if (currentTime < expirationTime) {
        const remainingTime = expirationTime - currentTime;
        const remainingMinutes = Math.ceil(remainingTime / 60);
        return NextResponse.json({
          success: false,
          error: `Lock period has not expired yet. ${remainingMinutes} minutes remaining.`
        } as ReleaseFundsResponse, { status: 400 });
      }
      
    } catch (error) {
      console.error('Error checking contract state:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to verify transfer status'
      } as ReleaseFundsResponse, { status: 500 });
    }
    
    // Get recipient address from contract state
    const recipientAddress = contractState['safient_receiver'];
    const transferAmount = (contractState['safient_amount'] || 0) / 1_000_000; // Convert to ALGO
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create application call transaction for release_funds
    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: callerAccount.addr,
      appIndex: SAFIENT_AI_APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [
        new Uint8Array(Buffer.from('safient_release'))
      ],
      accounts: [callerAccount.addr, recipientAddress],
      suggestedParams,
      note: new Uint8Array(Buffer.from(`Safient Release: ${body.transferId}`))
    });
    
    // Sign transaction
    const signedTxn = appCallTxn.signTxn(callerAccount.sk);
    
    // Submit transaction
    const txResponse = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = txResponse.txid;
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    // Prepare response
    const response: ReleaseFundsResponse = {
      success: true,
      transactionId: txId,
      recipientAddress,
      releasedAmount: transferAmount,
      blockRound: Number(confirmedTxn.confirmedRound),
      releasedAt: Math.floor(Date.now() / 1000)
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Release Safient AI funds error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as ReleaseFundsResponse, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Safient AI Release Funds API',
    version: '1.0.0',
    methods: ['POST'],
    description: 'Release funds to recipient after lock period expires'
  });
}