'use client';

import React, { useEffect, useMemo, useState } from 'react';
import CountdownTimer from './CountdownTimer';

type SafientStatus = 'pending' | 'completed' | 'reclaimed' | 'failed' | 'escrowed';

type TransactionType = 'safient_ai_transfer' | 'regular_transfer';

type SafientEscrowData = {
  escrow_address?: string;
  expires_at?: string;
  created_at?: string;
  duration_hours?: number;
  can_reclaim?: boolean;
  lock_duration_minutes?: number;
};

type SafientTransaction = {
  transaction_id: string;
  transfer_id: string;
  type: TransactionType;
  amount: number;
  locked_amount?: number;
  recipient: string;
  sender: string;
  original_recipient?: string;
  status: SafientStatus;
  timestamp: string;
  transaction_hash?: string;
  release_transaction_hash?: string;
  auto_released?: boolean;
  reserved_funds?: {
    minimum_balance?: number;
    projected_network_fee?: number;
    safient_reserve?: number;
  };
  escrow_data?: SafientEscrowData;
};

interface TransactionHistoryProps {
  userAddress?: string;
  userMnemonic?: string;
}

const formatAmount = (amount: number) => {
  if (!Number.isFinite(amount)) return '0.000';
  return (Math.abs(amount) / 1_000_000).toFixed(3);
};

const truncateAddress = (address?: string) => {
  if (!address) return 'Unknown Address';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

const statusBadgeClass = (status: SafientStatus) => {
  switch (status) {
    case 'completed':
      return 'text-green-700 bg-green-100';
    case 'reclaimed':
      return 'text-blue-700 bg-blue-100';
    case 'escrowed':
      return 'text-indigo-700 bg-indigo-100';
    case 'pending':
      return 'text-yellow-700 bg-yellow-100';
    case 'failed':
      return 'text-red-700 bg-red-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
};

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  userAddress,
  userMnemonic
}) => {
  const [transactions, setTransactions] = useState<SafientTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReclaiming, setIsReclaiming] = useState(false);

  const fetchTransactions = async (address: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/Algorand/Algo-smart/api/get-transactions?user=${address}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load transactions');
      }

      const safientOnly: SafientTransaction[] = (data.transactions ?? []).filter(
        (tx: SafientTransaction) => tx.type === 'safient_ai_transfer'
      );

      setTransactions(safientOnly);
      setError(null);
    } catch (err) {
      console.error('[TransactionHistory] Failed to load transactions', err);
      setError(err instanceof Error ? err.message : 'Network error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userAddress) return;
    fetchTransactions(userAddress);
  }, [userAddress]);

  useEffect(() => {
    if (!userAddress) return;
    const interval = setInterval(() => fetchTransactions(userAddress), 15000);
    return () => clearInterval(interval);
  }, [userAddress]);

  const handleReclaim = async (transferId: string) => {
    if (!userAddress || !userMnemonic) {
      alert('Wallet details missing. Please reconnect your wallet.');
      return;
    }

    setIsReclaiming(true);
    try {
      const response = await fetch('/Algorand/Algo-smart/api/reclaim-escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          senderMnemonic: userMnemonic
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Reclaim failed');
      }

      await fetchTransactions(userAddress);
      alert('✅ Safient returned the funds to your wallet.');
    } catch (err) {
      console.error('[TransactionHistory] Reclaim failed', err);
      alert(err instanceof Error ? err.message : 'Network error during reclaim.');
    } finally {
      setIsReclaiming(false);
    }
  };

  const formattedTransactions = useMemo(() => {
    return transactions.map((tx) => {
      const expiresAt = tx.escrow_data?.expires_at ? new Date(tx.escrow_data.expires_at) : null;
      const expired = expiresAt ? Date.now() >= expiresAt.getTime() : false;
      const autoReleased =
        tx.status === 'completed' || Boolean(tx.release_transaction_hash || tx.auto_released);
      const canReclaim =
        tx.status === 'escrowed' &&
        !autoReleased &&
        Boolean(tx.escrow_data?.can_reclaim) &&
        !expired;

      return {
        base: tx,
        expiresAt,
        expired,
        autoReleased,
        canReclaim,
        awaitingRelease: tx.status === 'escrowed' && expired && !autoReleased
      };
    });
  }, [transactions]);

  if (loading) {
    return <div className="py-6 text-center text-gray-500">Loading Safient activity…</div>;
  }

  if (error) {
    return (
      <div className="py-6 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!formattedTransactions.length) {
    return (
      <div className="py-10 text-center text-gray-500 border rounded-lg bg-gray-50">
        No Safient activity yet. Your protected transfers will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {formattedTransactions.map(({ base, expiresAt, expired, autoReleased, canReclaim, awaitingRelease }) => {
        const recipientDisplay = truncateAddress(base.original_recipient ?? base.recipient);
        const senderDisplay = truncateAddress(base.sender);
        const safientVaultMasked = truncateAddress(base.escrow_data?.escrow_address);
        const lockedAmount = base.locked_amount ?? base.amount;
        const netAmount = base.amount;
        const badgeStatus: SafientStatus = autoReleased ? 'completed' : base.status;

        let title = '';
        switch (badgeStatus) {
          case 'completed':
            title = `Safient released to ${recipientDisplay}`;
            break;
          case 'reclaimed':
            title = `Safient returned to ${senderDisplay}`;
            break;
          case 'escrowed':
            title = `Safient protection for ${recipientDisplay}`;
            break;
          default:
            title = `Safient transfer for ${recipientDisplay}`;
        }

        return (
          <div key={base.transaction_id} className="border rounded-xl p-5 bg-white shadow-sm">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-lg text-gray-900">{title}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClass(badgeStatus)}`}>
                    {badgeStatus === 'completed'
                      ? 'Safient Released'
                      : badgeStatus === 'reclaimed'
                      ? 'Safient Return'
                      : badgeStatus === 'escrowed'
                      ? awaitingRelease
                        ? 'Awaiting Release'
                        : 'Safient Protected'
                      : badgeStatus.toUpperCase()}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Created: {new Date(base.timestamp).toLocaleString()}
                </div>

                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Amount secured:</span> {formatAmount(lockedAmount)} ALGO
                  </div>
                  <div>
                    <span className="font-medium">Net deliverable:</span> {formatAmount(netAmount)} ALGO
                  </div>
                  <div>
                    <span className="font-medium">Safient destination:</span> {recipientDisplay}
                  </div>
                  {base.status === 'reclaimed' && (
                    <div>
                      <span className="font-medium">Returned to:</span> {senderDisplay}
                    </div>
                  )}
                  {base.reserved_funds?.safient_reserve && (
                    <div className="text-xs text-gray-500">
                      Safient reserve held {formatAmount(base.reserved_funds.safient_reserve)} ALGO
                      {base.reserved_funds.minimum_balance && base.reserved_funds.projected_network_fee
                        ? ` (minimum balance ${formatAmount(base.reserved_funds.minimum_balance)} + fees ${formatAmount(
                            base.reserved_funds.projected_network_fee
                          )})`
                        : ''}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Transfer ID: {base.transfer_id}
                  </div>
                  {base.transaction_hash && (
                    <div className="text-xs font-mono text-gray-500 break-all">
                      Lock Tx: {base.transaction_hash}
                    </div>
                  )}
                  {base.release_transaction_hash && (
                    <div className="text-xs font-mono text-gray-500 break-all">
                      Release Tx: {base.release_transaction_hash}
                    </div>
                  )}
                  {base.escrow_data?.escrow_address && (
                    <div className="text-xs text-gray-400">
                      Safient vault: {safientVaultMasked}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-[220px] space-y-3 text-sm">
                {base.status === 'reclaimed' && (
                  <div className="p-3 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    ✅ Safient returned the protected ALGO to your wallet.
                  </div>
                )}

                {autoReleased && (
                  <div className="p-3 rounded-md bg-green-50 text-green-700 border border-green-100">
                    ✅ Safient delivered {formatAmount(netAmount)} ALGO to {recipientDisplay}.
                    {base.release_transaction_hash && (
                      <div className="mt-1 text-xs font-mono break-all">
                        Confirmation: {base.release_transaction_hash}
                      </div>
                    )}
                  </div>
                )}

                {awaitingRelease && (
                  <div className="p-3 rounded-md bg-orange-50 text-orange-700 border border-orange-100">
                    ⏳ Protection window ended. Safient is finalizing the release automatically—no action needed.
                  </div>
                )}

                {base.status === 'escrowed' && !autoReleased && (
                  <div className="text-gray-600">
                    {expiresAt ? (
                      <CountdownTimer
                        expiresAt={expiresAt.toISOString()}
                        canReclaim={canReclaim}
                        transferId={base.transfer_id}
                        status={awaitingRelease ? 'escrowed' : base.status}
                      />
                    ) : (
                      <div className="text-xs text-gray-500">Awaiting scheduled Safient release</div>
                    )}
                  </div>
                )}

                {canReclaim && (
                  <button
                    onClick={() => handleReclaim(base.transfer_id)}
                    disabled={isReclaiming}
                    className={`w-full px-4 py-2 text-sm font-semibold text-white rounded-md ${
                      isReclaiming ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isReclaiming ? 'Reclaiming…' : 'Reclaim Funds'}
                  </button>
                )}

                {!canReclaim && base.status === 'escrowed' && !autoReleased && (
                  <div className="text-xs text-gray-500">
                    Reclaim option is disabled once the protection window ends.
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TransactionHistory;