'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, User, Shield, Wallet } from 'lucide-react';

interface DynamicTransaction {
  transfer_id: string;
  user_a: {
    address: string;
    user_id: string;
    role: string;
    status: string;
  };
  user_b: {
    address: string;
    user_id: string;
    role: string;
    status: string;
  };
  safient_ai_escrow: {
    status: 'pending' | 'completed' | 'expired';
    protection_active: boolean;
    countdown_remaining: number;
    can_reclaim: boolean;
    can_release: boolean;
  };
  transaction_details: {
    amount: number;
    amount_algo: number;
    created_at: string;
    expires_at: string;
    timeout_period: number;
  };
}

interface UserStats {
  total_users: number;
  registered_users: Array<{
    wallet_address: string;
    user_id: string;
    wallet_type: string;
    balance: number;
  }>;
}

const DynamicTransactionTracker: React.FC = () => {
  const [transactions, setTransactions] = useState<DynamicTransaction[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'expired'>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load transactions
      const transactionResponse = await fetch('/api/Algorand/Algo-smart/api/get-transactions');
      const transactionData = await transactionResponse.json();
      setTransactions(transactionData.transactions || []);

      // Load user statistics
      const userResponse = await fetch('/api/Algorand/Algo-smart/api/register-user');
      const userData = await userResponse.json();
      setUserStats(userData);

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const filteredTransactions = transactions.filter(tx => {
    const statusMatch = filter === 'all' || tx.safient_ai_escrow.status === filter;
    const userMatch = selectedUser === 'all' || 
                     tx.user_a.address === selectedUser || 
                     tx.user_b.address === selectedUser;
    return statusMatch && userMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with User Statistics */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-900">Dynamic Transaction Tracker</h2>
          <div className="bg-blue-100 px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800">
                {userStats?.total_users || 0} Registered Users
              </span>
            </div>
          </div>
        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Status Filter */}
          <div className="flex space-x-2">
            <span className="text-sm font-medium text-gray-700 self-center">Status:</span>
            {['all', 'pending', 'completed', 'expired'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={`px-3 py-1 rounded-lg text-sm capitalize ${
                  filter === filterType
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>

          {/* User Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">User:</span>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Users</option>
              {userStats?.registered_users.map((user) => (
                <option key={user.wallet_address} value={user.wallet_address}>
                  {user.user_id} ({formatAddress(user.wallet_address)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Cards */}
      <div className="space-y-4">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.transfer_id} className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(transaction.safient_ai_escrow.status)}
                <h3 className="text-lg font-semibold">
                  Transfer: {transaction.transfer_id.slice(0, 8)}...
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  transaction.safient_ai_escrow.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : transaction.safient_ai_escrow.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {transaction.safient_ai_escrow.status.toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  {transaction.transaction_details.amount_algo} ALGO
                </div>
                {transaction.safient_ai_escrow.status === 'pending' && (
                  <div className="text-sm text-red-600 font-medium">
                    ⏱️ {formatCountdown(transaction.safient_ai_escrow.countdown_remaining)}
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic User Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Sender (User A) */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Sender</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  ID: {transaction.user_a.user_id}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {formatAddress(transaction.user_a.address)}
                </div>
                <div className="text-sm font-medium text-blue-600">
                  Status: {transaction.user_a.status}
                </div>
              </div>

              {/* Safient AI Escrow */}
              <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Safient AI Escrow</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  Protection: {transaction.safient_ai_escrow.protection_active ? '🛡️ Active' : '❌ Inactive'}
                </div>
                <div className="text-sm font-medium text-purple-600">
                  Status: {transaction.safient_ai_escrow.status}
                </div>
                {transaction.safient_ai_escrow.status === 'pending' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${(transaction.safient_ai_escrow.countdown_remaining / transaction.transaction_details.timeout_period) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Receiver (User B) */}
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Receiver</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">
                  ID: {transaction.user_b.user_id}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {formatAddress(transaction.user_b.address)}
                </div>
                <div className="text-sm font-medium text-green-600">
                  Status: {transaction.user_b.status}
                </div>
              </div>
            </div>

            {/* Action Buttons for Pending Transactions */}
            {transaction.safient_ai_escrow.status === 'pending' && (
              <div className="flex space-x-3 pt-4 border-t">
                {transaction.safient_ai_escrow.can_reclaim && (
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    🔄 Reclaim Funds ({transaction.user_a.user_id})
                  </button>
                )}
                {transaction.safient_ai_escrow.can_release && (
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    ✅ Release Funds ({transaction.user_b.user_id})
                  </button>
                )}
                <div className="text-sm text-gray-500 self-center">
                  Auto-release to {transaction.user_b.user_id} in {formatCountdown(transaction.safient_ai_escrow.countdown_remaining)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            No {filter !== 'all' ? filter : ''} transactions found
            {selectedUser !== 'all' && ' for selected user'}.
          </div>
          <div className="text-gray-400 text-sm">
            {userStats?.total_users || 0} users registered and ready for transactions.
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicTransactionTracker;