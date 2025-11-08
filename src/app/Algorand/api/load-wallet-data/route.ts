import { NextRequest, NextResponse } from 'next/server';
import { getAllWalletAddresses, getWalletData } from '../../utils/storage';

interface WalletData {
  walletAddress: string;
  mnemonicPhrase: string;
  createdAt: string;
  network: string;
  importedAt?: string;
  balance?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get all wallet addresses (works on Vercel!)
    const addresses = await getAllWalletAddresses();
    
    if (addresses.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No wallet data found'
      }, { status: 404 });
    }
    
    // Load the most recent wallet
    const latestAddress = addresses[addresses.length - 1];
    const walletData: WalletData | null = await getWalletData(latestAddress);
    
    if (!walletData) {
      return NextResponse.json({
        success: false,
        message: 'Failed to load wallet data'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      walletData: {
        address: walletData.walletAddress,
        mnemonic: walletData.mnemonicPhrase,
        network: walletData.network,
        createdAt: walletData.createdAt,
        importedAt: walletData.importedAt,
        balance: walletData.balance
      }
    });
  } catch (error) {
    console.error('Error loading wallet data:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load wallet data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}