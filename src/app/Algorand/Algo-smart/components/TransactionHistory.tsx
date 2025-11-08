'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Transaction {
  transaction_id: string;
  transfer_id: string;
  type: 'safient_lock' | 'safient_release' | 'safient_return' | 'safient_status' | 'safient_ai_transfer' | 'regular_transfer';
  amount: number;
  locked_amount?: number;
  recipient: string;
  sender: string;
  status: 'pending' | 'completed' | 'reclaimed' | 'failed' | 'escrowed';
  timestamp: string;
  block_round: number;
  transaction_hash: string;
  gas_fee?: number;
  original_recipient?: string;
  reserved_funds?: {
    minimum_balance?: number;
    projected_network_fee?: number;
    safient_reserve?: number;
  };
  escrow_data?: {
    escrow_address?: string;
    expires_at?: string;
    created_at?: string;
    duration_hours?: number;
    can_reclaim?: boolean;
    lock_duration_minutes?: number;
  };
}

interface TransactionHistoryProps {
  userAddress?: string;
  limit?: number;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ 
  userAddress, 
  limit = 10 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReclaiming, setIsReclaiming] = useState(false);
  const [reclaimingId, setReclaimingId] = useState<string | null>(null);
  const autoReleaseTriggered = useRef<Set<string>>(new Set());

  const handleReclaimFunds = async (transferId: string) => {
    try {
      setIsReclaiming(true);
      setReclaimingId(transferId);
      
      // API call to reclaim funds
      // ...
      
      // Update transaction status
      setTransactions(prevTransactions => 
        prevTransactions.map(tx => 
          tx.transfer_id === transferId 
            ? { ...tx, status: 'reclaimed' } 
            : tx
        )
      );
      
    } catch (err) {
      // Error handling
    } finally {
      setIsReclaiming(false);
      setReclaimingId(null);
    }
  };
  
    const fetchTransactions = async () => {
      try {
        setLoading(true);
      if (!userAddress) {
        setTransactions([]);
        return;
      }

      const url = `/api/transactions/safient-ai?user=${userAddress}&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data.transactions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
  useEffect(() => {
    fetchTransactions();
  }, [userAddress, limit]);

  useEffect(() => {
    if (!userAddress) return;

    const interval = setInterval(() => {
      fetchTransactions();
    }, 15000);

    return () => clearInterval(interval);
  }, [userAddress, limit]);

  useEffect(() => {
    const triggerAutoRelease = async (transferId: string) => {
      try {
        await fetch('/Algorand/Algo-smart/api/auto-release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transferId })
        });
      } catch (err) {
        console.error('❌ [AUTO-RELEASE] Failed to trigger release:', err);
      } finally {
        fetchTransactions();
      }
    };

    transactions.forEach(tx => {
      const safientTx = tx as Transaction;
      if (
        safientTx.safientProtected &&
        safientTx.status === 'escrowed' &&
        safientTx.transfer_id &&
        safientTx.escrow_data?.expires_at &&
        new Date() >= new Date(safientTx.escrow_data.expires_at) &&
        !autoReleaseTriggered.current.has(safientTx.transfer_id)
      ) {
        autoReleaseTriggered.current.add(safientTx.transfer_id);
        triggerAutoRelease(safientTx.transfer_id);
      }
    });
  }, [transactions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'reclaimed': return 'text-blue-600 bg-blue-100';
      case 'escrowed': return 'text-indigo-600 bg-indigo-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safient_lock': return '📤';
      case 'safient_release': return '✅';
      case 'safient_return': return '↩️';
      case 'safient_status': return '🔍';
      case 'safient_ai_transfer': return '📤';
      case 'regular_transfer': return '💸';
      default: return '📋';
    }
  };

  const formatAmount = (amount: number): string => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return '0.000';
    }
    
    // Convert microALGO to ALGO (1 ALGO = 1,000,000 microALGO)
    const algoAmount = Math.abs(amount) / 1000000;
    
    // Format with 3 decimal places instead of 6
    return algoAmount.toFixed(3);
  };
  
  // Around line 85, improve address truncation:
  const truncateAddress = (address: string): string => {
    if (!address || typeof address !== 'string') {
      return 'Invalid Address';
    }
    if (address.length < 12) {
      return address;
    }
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-red-600 mr-2">❌</span>
          <span className="text-red-800">Error: {error}</span>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <span className="text-gray-500 text-lg">📭</span>
        <p className="text-gray-600 mt-2">No transactions found</p>
        <p className="text-gray-500 text-sm">Transactions will appear here once you start using Safient AI</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 Transaction History
        </h3>
        <p className="text-sm text-gray-600">
          {userAddress ? `Showing transactions for ${truncateAddress(userAddress)}` : 'All Safient AI transactions'}
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => {
          const isSafient = transaction.type === 'safient_ai_transfer';
          const recipientDisplay = truncateAddress(transaction.original_recipient ?? transaction.recipient);
          const senderDisplay = truncateAddress(transaction.sender);
          const escrowAddress = transaction.escrow_data?.escrow_address ? truncateAddress(transaction.escrow_data.escrow_address) : undefined;
          const expiresAtDate = transaction.escrow_data?.expires_at ? new Date(transaction.escrow_data.expires_at) : null;
          const isExpired = expiresAtDate ? new Date() >= expiresAtDate : false;
          const canReclaimBackend = transaction.escrow_data?.can_reclaim ?? true;
          const canReclaim = isSafient && canReclaimBackend && !isExpired;

          let titleText = '';
          let badgeText = transaction.status;

          if (isSafient) {
            switch (transaction.status) {
              case 'reclaimed':
                titleText = `Returned to ${senderDisplay}`;
                badgeText = 'Safient Return';
                break;
              case 'completed':
                titleText = `Released to ${recipientDisplay}`;
                badgeText = 'Safient Released';
                break;
              case 'escrowed':
                titleText = `Safient protection for ${recipientDisplay}`;
                badgeText = 'Safient Protected';
                break;
              default:
                titleText = `Safient transfer for ${recipientDisplay}`;
                badgeText = 'Safient Event';
            }
          } else {
            const isOutgoing = transaction.amount <= 0;
            titleText = `${isOutgoing ? 'Sent to' : 'Received from'} ${recipientDisplay}`;
          }

          const amountMagnitude = Math.abs(transaction.amount);
          const safientAmountSign = transaction.status === 'reclaimed' ? '+' : '-';
          const amountSign = isSafient ? safientAmountSign : (transaction.amount < 0 ? '-' : '+');
          const lockedAmount = transaction.locked_amount ?? amountMagnitude;
          const reserveTotal = transaction.reserved_funds?.safient_reserve;
          const minBalanceReserve = transaction.reserved_funds?.minimum_balance;
          const feeReserve = transaction.reserved_funds?.projected_network_fee;

          return (
          <div key={transaction.transaction_id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getTypeIcon(transaction.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {titleText}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {badgeText}
                    </span>
                  </div>
                  
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Amount:</span> {amountSign}{formatAmount(isSafient ? amountMagnitude : transaction.amount)} ALGO
                      </p>
                      {isSafient ? (
                        <>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Safient destination:</span> {recipientDisplay}
                          </p>
                          {transaction.status === 'reclaimed' && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Returned to:</span> {senderDisplay}
                            </p>
                          )}
                          {escrowAddress && (
                            <p className="text-xs text-gray-400">
                              <span className="font-medium">Safient vault:</span> Hidden
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                    <p className="text-sm text-gray-600">
                            <span className="font-medium">From:</span> {senderDisplay}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">To:</span> {truncateAddress(transaction.recipient)}
                    </p>
                        </>
                      )}
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Transfer ID:</span> {transaction.transfer_id}
                    </p>
                    {isSafient && lockedAmount !== amountMagnitude && (
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Original Safient hold:</span> {formatAmount(lockedAmount)} ALGO
                      </p>
                    )}
                    {isSafient && reserveTotal && reserveTotal > 0 && (
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Safient reserve:</span> {formatAmount(reserveTotal)} ALGO
                        {minBalanceReserve && feeReserve ? ` (includes ${formatAmount(minBalanceReserve)} ALGO minimum balance + ${formatAmount(feeReserve)} ALGO fees)` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right text-sm text-gray-500">
                <p>{formatDate(transaction.timestamp)}</p>
                <p className="mt-1">Block: {transaction.block_round}</p>
                {transaction.gas_fee && (
                  <p className="mt-1">Fee: {formatAmount(transaction.gas_fee)} ALGO</p>
                )}
              </div>
            </div>
            
            {transaction.transaction_hash && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">TX Hash:</span>
                  <span className="ml-1 font-mono break-all">{transaction.transaction_hash}</span>
                </p>
              </div>
            )}
            
              {isSafient && transaction.status === 'escrowed' && canReclaim && transaction.transfer_id && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button 
                    onClick={() => handleReclaimFunds(transaction.transfer_id!)}
                  disabled={isReclaiming}
                  className={`px-4 py-2 rounded-md text-white font-medium ${isReclaiming ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isReclaiming ? 'Reclaiming...' : 'Reclaim Funds'}
                </button>
                {transaction.timestamp && (
                  <div className="mt-2">
                      <ProtectionTimer createdAt={transaction.timestamp} expiresAt={transaction.escrow_data?.expires_at} status={transaction.status} />
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>
      
      {transactions.length >= limit && (
        <div className="px-6 py-4 border-t border-gray-200 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Load More Transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;


const ProtectionTimer = ({ createdAt, expiresAt, status }: { createdAt: string; expiresAt?: string; status: string }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    // If already reclaimed or completed, show as expired
    if (status === 'reclaimed' || status === 'completed') {
      setTimeRemaining('Expired');
      return;
    }
    
    const calculateTimeRemaining = () => {
      const created = new Date(createdAt).getTime();
      const now = new Date().getTime();
      const expiryTime = expiresAt ? new Date(expiresAt).getTime() : created + (30 * 60 * 1000);
      
      if (now >= expiryTime) {
        setTimeRemaining('Expired');
        return;
      }
      
      const diff = expiryTime - now;
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [createdAt, expiresAt, status]);
  
  return (
    <div className="flex items-center">
      <span className="text-xs text-gray-500">Protection expires:</span>
      <span className="ml-1 text-xs font-medium">{timeRemaining}</span>
      <span className="ml-1 text-xs text-gray-500">
        {status === 'reclaimed' ? '(Funds reclaimed)' : 
         status === 'completed' ? '(Funds released)' : 
         timeRemaining === 'Expired' ? '(Funds auto-released)' : 
         '(minutes remaining)'}
      </span>
    </div>
  );
};