import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as algosdk from 'algosdk';

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
      
      // Convert address to string for proper comparison
      if (account.addr.toString() !== address) {
        return NextResponse.json(
          { success: false, error: 'Mnemonic does not match the provided address' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid mnemonic phrase' },
        { status: 400 }
      );
    }

    // Connect to Algorand testnet to verify account exists
    let accountInfo = null;
    let balance = 0;
    
    try {
      // Algorand testnet configuration
      const algodToken = '';
      const algodServer = 'https://testnet-api.algonode.cloud';
      const algodPort = 443;
      
      const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
      
      // Try to get account information from testnet
      try {
        accountInfo = await algodClient.accountInformation(address).do();
        balance = Number(accountInfo.amount || 0); // Convert bigint to number
        
        console.log(`Account found on testnet with balance: ${balance} microAlgos`);
      } catch (accountError: any) {
        // Account might not exist on testnet (never funded)
        if (accountError.status === 404) {
          console.log('Account not found on testnet - this is normal for new/unfunded accounts');
          // This is actually fine - account can exist without being funded
        } else {
          console.warn('Error checking account on testnet:', accountError.message);
        }
      }
    } catch (networkError) {
      console.warn('Network error connecting to testnet:', networkError);
      // Continue with import even if network check fails
    }

    // Create userdata directory if it doesn't exist
    const userdataDir = join(process.cwd(), 'src', 'app', 'Algorand', 'userdata');
    await mkdir(userdataDir, { recursive: true });

    // Prepare wallet data
    const walletData: WalletData = {
      walletAddress: address,
      mnemonicPhrase: mnemonic.trim().toLowerCase(),
      createdAt: new Date().toISOString(), // When wallet was originally created
      importedAt: new Date().toISOString(), // When wallet was imported
      network: 'testnet',
      balance: balance
    };

    // Create JSON file with wallet address as filename
    const fileName = `${address}.json`;
    const filePath = join(userdataDir, fileName);
    
    // Write wallet data to file
    await writeFile(filePath, JSON.stringify(walletData, null, 2), 'utf8');

    // Also save to localStorage format for compatibility
    const responseData = {
      success: true,
      message: 'Wallet imported successfully',
      walletData: {
        address: address,
        balance: balance,
        network: 'testnet',
        fileName: fileName
      }
    };

    return NextResponse.json(responseData);

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