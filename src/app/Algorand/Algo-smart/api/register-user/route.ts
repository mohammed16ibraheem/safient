import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface UserRegistration {
  wallet_address: string;
  wallet_type: string;
  user_id: string;
  balance: number;
  registration_timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { wallet_address, wallet_type, user_id } = await request.json();
    
    if (!wallet_address || !wallet_type) {
      return NextResponse.json(
        { error: 'Wallet address and type are required' },
        { status: 400 }
      );
    }

    const transactionPath = path.join(
      process.cwd(),
      'src/app/Algorand/Transaction/safient_ai_transactions.json'
    );

    let transactionData;
    try {
      const fileContent = fs.readFileSync(transactionPath, 'utf8');
      transactionData = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to read transaction data' },
        { status: 500 }
      );
    }

    // Check if user already exists
    const existingUser = transactionData.dynamic_user_registry.users.find(
      (user: any) => user.wallet_address === wallet_address
    );

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already registered', user: existingUser },
        { status: 200 }
      );
    }

    // Register new user
    const newUser: UserRegistration = {
      wallet_address,
      wallet_type,
      user_id: user_id || `user_${Date.now()}`,
      balance: 0,
      registration_timestamp: new Date().toISOString()
    };

    transactionData.dynamic_user_registry.users.push(newUser);
    transactionData.dynamic_user_registry.wallet_connections.push({
      address: wallet_address,
      connected_at: new Date().toISOString(),
      status: 'active'
    });
    transactionData.dynamic_user_registry.address_mapping[wallet_address] = newUser.user_id;
    
    transactionData.user_statistics.total_users = transactionData.dynamic_user_registry.users.length;
    transactionData.user_statistics.active_users.push(wallet_address);
    transactionData.contract_info.last_updated = new Date().toISOString();

    // Save updated data
    fs.writeFileSync(transactionPath, JSON.stringify(transactionData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: newUser,
      total_users: transactionData.user_statistics.total_users
    });

  } catch (error) {
    console.error('User registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const transactionPath = path.join(
      process.cwd(),
      'src/app/Algorand/Transaction/safient_ai_transactions.json'
    );

    const fileContent = fs.readFileSync(transactionPath, 'utf8');
    const transactionData = JSON.parse(fileContent);

    return NextResponse.json({
      total_users: transactionData.user_statistics.total_users,
      registered_users: transactionData.dynamic_user_registry.users,
      active_connections: transactionData.dynamic_user_registry.wallet_connections
    });

  } catch (error) {
    console.error('Failed to get users:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve users' },
      { status: 500 }
    );
  }
}