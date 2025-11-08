import { NextRequest, NextResponse } from 'next/server';
import algosdk from 'algosdk';
import { TransferStatusRequest, TransferStatusResponse } from '../../types/safient-ai';
import { getRemainingTime, formatRemainingTime } from '../../utils/safient-ai-operations';

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
    const body: TransferStatusRequest = await request.json();
    
    // Validate required fields
    if (!body.transferId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: transferId'
      } as TransferStatusResponse, { status: 400 });
    }
    
    // Check if Safient AI contract is deployed
    if (!SAFIENT_AI_APP_ID) {
      return NextResponse.json({
        success: false,
        error: 'Safient AI contract not deployed. Please contact support.'
      } as TransferStatusResponse, { status: 500 });
    }
    
    // Get contract state
    let contractState: { [key: string]: any } = {};
    let appExists = false;
    
    try {
      const appInfo = await algodClient.getApplicationByID(SAFIENT_AI_APP_ID).do();
      const globalState = appInfo.params.globalState;
      appExists = true;
      
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
      
    } catch (error) {
      console.error('Error getting contract state:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to retrieve transfer status'
      } as TransferStatusResponse, { status: 500 });
    }
    
    if (!appExists || Object.keys(contractState).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Transfer not found'
      } as TransferStatusResponse, { status: 404 });
    }
    
    // Parse contract state
    const senderAddress = contractState['safient_sender'] || '';
    const recipientAddress = contractState['safient_receiver'] || '';
    const amountMicroAlgos = contractState['safient_amount'] || 0;
    const amount = amountMicroAlgos / 1_000_000; // Convert to ALGO
    const lockWindowSeconds = contractState['safient_window'] || 0;
    const creationTime = contractState['safient_initiated'] || 0;
    const unlockTime = contractState['safient_unlocks'] || 0;
    const statusCode = contractState['safient_state'] || 0;
    
    // Map status code to string
    let status: 'pending' | 'active' | 'completed' | 'reclaimed' | 'expired' | 'failed';
    switch (statusCode) {
      case 1:
        status = 'active';
        break;
      case 2:
        status = 'completed';
        break;
      case 3:
        status = 'reclaimed';
        break;
      default:
        status = 'failed';
    }
    
    // Check if transfer has expired but not yet processed
    const currentTime = Math.floor(Date.now() / 1000);
    if (status === 'active' && currentTime >= unlockTime) {
      status = 'expired';
    }
    
    // Calculate remaining time
    const remainingTimeSeconds = getRemainingTime(unlockTime);
    const formattedRemainingTime = formatRemainingTime(remainingTimeSeconds);
    
    // Calculate lock duration in minutes
    const lockDurationMinutes = Math.round(lockWindowSeconds / 60);
    
    // Get transaction history for this transfer
    let transactionHistory: any[] = [];
    try {
      // Note: searchForTransactions is not available in algodClient
      // We'll use a placeholder for now
      const recentTxns = { transactions: [] };
      
      transactionHistory = recentTxns.transactions
        .filter((txn: any) => {
          // Filter transactions related to this transfer
          return txn.note && Buffer.from(txn.note, 'base64').toString().includes(body.transferId);
        })
        .map((txn: any) => ({
          id: txn.id,
          type: txn['tx-type'],
          sender: txn.sender,
          confirmedRound: txn['confirmed-round'],
          roundTime: txn['round-time'],
          note: txn.note ? Buffer.from(txn.note, 'base64').toString() : ''
        }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      // Continue without transaction history
    }
    
    // Prepare response
    const response: TransferStatusResponse = {
      success: true,
      status,
      senderAddress,
      recipientAddress,
      amount,
      lockDurationMinutes,
      creationTime,
      expirationTime: unlockTime,
      remainingTimeSeconds,
      formattedRemainingTime,
      canReclaim: status === 'active' && remainingTimeSeconds > 0,
      canRelease: status === 'active' && remainingTimeSeconds <= 0,
      isExpired: status === 'expired' || (status === 'active' && remainingTimeSeconds <= 0),
      appId: SAFIENT_AI_APP_ID,
      transactionHistory
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Get Safient AI transfer status error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as TransferStatusResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Support GET method with query parameters
  const { searchParams } = new URL(request.url);
  const transferId = searchParams.get('transferId');
  
  if (!transferId) {
    return NextResponse.json({
      message: 'Safient AI Transfer Status API',
      version: '1.0.0',
      methods: ['GET', 'POST'],
      description: 'Check the status of a Safient AI transfer',
      usage: {
        GET: 'Use query parameter: ?transferId=<transfer_id>',
        POST: 'Send JSON body with transferId field'
      }
    });
  }
  
  // Create a mock request object for the POST handler
  const mockRequest = {
    json: async () => ({ transferId })
  } as NextRequest;
  
  return POST(mockRequest);
}