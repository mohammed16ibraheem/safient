import { NextRequest, NextResponse } from 'next/server';
import * as algosdk from 'algosdk';

export async function POST(request: NextRequest) {
  try {
    const { mnemonic } = await request.json();

    if (!mnemonic || typeof mnemonic !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mnemonic phrase is required' },
        { status: 400 }
      );
    }

    // Clean and validate mnemonic format
    const cleanMnemonic = mnemonic.trim().toLowerCase();
    const words = cleanMnemonic.split(/\s+/);

    // Check if exactly 25 words (Algorand standard)
    if (words.length !== 25) {
      return NextResponse.json(
        { success: false, error: 'Mnemonic must contain exactly 25 words for Algorand' },
        { status: 400 }
      );
    }

    try {
      // Use algosdk to validate mnemonic and generate account
      const secretKey = algosdk.mnemonicToSecretKey(cleanMnemonic);
      const account = algosdk.mnemonicToSecretKey(cleanMnemonic);
      const address = account.addr.toString(); // Convert Address object to string

      // Verify the mnemonic by converting back
      const regeneratedMnemonic = algosdk.secretKeyToMnemonic(secretKey.sk);
      
      if (regeneratedMnemonic !== cleanMnemonic) {
        return NextResponse.json(
          { success: false, error: 'Invalid mnemonic phrase - verification failed' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        address: address, // Now this is a string, not an object
        message: 'Mnemonic phrase is valid'
      });

    } catch (algoError) {
      // algosdk will throw an error if mnemonic is invalid
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid mnemonic phrase - not a valid BIP39 phrase or incorrect checksum' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Mnemonic validation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error during validation' 
      },
      { status: 500 }
    );
  }
}