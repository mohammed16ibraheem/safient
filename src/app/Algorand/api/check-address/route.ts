import { NextRequest, NextResponse } from 'next/server';
import { walletExists } from '../../utils/storage';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    // Check if wallet exists (works on Vercel!)
    const exists = await walletExists(address);
    
    return NextResponse.json({
      success: true,
      exists: exists,
      message: exists ? 'Address file found' : 'Address file not found'
    });

  } catch (error) {
    console.error('Error checking address:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error during address check',
        exists: false
      },
      { status: 500 }
    );
  }
}