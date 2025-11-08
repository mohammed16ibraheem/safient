import { NextRequest, NextResponse } from 'next/server';
import * as algosdk from 'algosdk';
import { saveWalletData } from '../../utils/storage';

interface WalletData {
  walletAddress: string;
  mnemonicPhrase: string;
  createdAt: string;
  network: string;
  importedAt: string;
  balance?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { mnemonic, address } = await request.json();

    if (!mnemonic || !address) {
      return NextResponse.json(
        { success: false, error: 'Mnemonic and address are required' },
        { status: 400 }
      );
    }

    // Re-validate mnemonic and address match
    try {
      const account = algosdk.mnemonicToSecretKey(mnemonic.trim().toLowerCase());

      if (account.addr.toString() !== address) {
        return NextResponse.json(
          { success: false, error: 'Mnemonic does not match the provided address' },
          { status: 400 }
        );
      }
    } catch (_error) {
      return NextResponse.json(
        { success: false, error: 'Invalid mnemonic phrase' },
        { status: 400 }
      );
    }

    // Connect to Algorand testnet to verify account exists
    let balance = 0;
    try {
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
      const accountInfo = await algodClient.accountInformation(address).do();
      balance = Number(accountInfo.amount || 0);
    } catch (accountError: any) {
      if (accountError?.status !== 404) {
        // Non-404 errors are logged but do not block the import
        console.warn('Error checking account on testnet:', accountError?.message || accountError);
      }
    }

    const walletData: WalletData = {
      walletAddress: address,
      mnemonicPhrase: mnemonic.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
      importedAt: new Date().toISOString(),
      network: 'testnet',
      balance
    };

    await saveWalletData(address, walletData);

    return NextResponse.json({
      success: true,
      message: 'Wallet imported successfully',
      walletData: {
        address,
        balance,
        network: 'testnet'
      }
    });
  } catch (error) {
    console.error('Wallet import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import wallet. Please try again.'
      },
      { status: 500 }
    );
  }
}