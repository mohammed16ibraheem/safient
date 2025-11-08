'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  RotateCcw,
  User,
  DollarSign,
  Copy,
  ExternalLink
} from 'lucide-react';
import { SafientAITransfer } from '../types/safient-ai';
import { formatRemainingTime, getRemainingTime } from '../utils/safient-ai-operations';

interface TransferStatusProps {
  transfer: SafientAITransfer;
  showActions?: boolean;
  onReclaim?: () => void;
  onRelease?: () => void;
  className?: string;
}

const TransferStatus: React.FC<TransferStatusProps> = ({
  transfer,
  showActions = false,
  onReclaim,
  onRelease,
  className = ''
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getStatusIcon = () => {
    switch (transfer.status) {
      case 'active':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'reclaimed':
        return <RotateCcw className="h-5 w-5 text-orange-600" />;
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (transfer.status) {
      case 'active':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'reclaimed':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'expired':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusText = () => {
    switch (transfer.status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'reclaimed':
        return 'Reclaimed';
      case 'expired':
        return 'Expired';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const remainingTime = getRemainingTime(transfer.expiresAt);
  const canReclaim = transfer.status === 'active' && remainingTime > 0;
  const canRelease = transfer.status === 'active' && remainingTime <= 0;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const openAlgoExplorer = (txId: string) => {
    const url = `https://testnet.algoexplorer.io/tx/${txId}`;
    window.open(url, '_blank');
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900">Safient AI Transfer</h3>
        </div>
        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>

      {/* Transfer Details */}
      <div className="space-y-3">
        {/* Amount */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Amount</span>
          </div>
          <span className="font-semibold text-gray-900">{transfer.amount} ALGO</span>
        </div>

        {/* Sender */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="h-4 w-4" />
            <span className="text-sm">From</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-gray-900">
              {formatAddress(transfer.senderAddress)}
            </span>
            <button
              onClick={() => copyToClipboard(transfer.senderAddress, 'sender')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
            {copiedField === 'sender' && (
              <span className="text-xs text-green-600">Copied!</span>
            )}
          </div>
        </div>

        {/* Recipient */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="h-4 w-4" />
            <span className="text-sm">To</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-gray-900">
              {formatAddress(transfer.recipientAddress)}
            </span>
            <button
              onClick={() => copyToClipboard(transfer.recipientAddress, 'recipient')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
            {copiedField === 'recipient' && (
              <span className="text-xs text-green-600">Copied!</span>
            )}
          </div>
        </div>

        {/* Lock Duration */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Protection Period</span>
          </div>
          <span className="text-sm text-gray-900">{transfer.metadata?.purpose ? '30' : '30'} minutes</span>
        </div>

        {/* Created At */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Created</span>
          <span className="text-sm text-gray-900">{formatDate(transfer.createdAt instanceof Date ? transfer.createdAt.getTime() : transfer.createdAt)}</span>
        </div>

        {/* Expiration */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Expires</span>
          <span className="text-sm text-gray-900">{formatDate(transfer.expiresAt instanceof Date ? transfer.expiresAt.getTime() : transfer.expiresAt)}</span>
        </div>

        {/* Remaining Time */}
        {transfer.status === 'active' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Remaining</span>
            <span className={`text-sm font-medium ${
              remainingTime <= 0 ? 'text-red-600' :
              remainingTime <= 300 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {remainingTime <= 0 ? 'Expired' : formatRemainingTime(remainingTime)}
            </span>
          </div>
        )}

        {/* Transaction ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Transaction</span>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-gray-900">
              {transfer.transactionId ? formatAddress(transfer.transactionId) : 'N/A'}
            </span>
            <button
              onClick={() => transfer.transactionId && copyToClipboard(transfer.transactionId, 'txId')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => transfer.transactionId && openAlgoExplorer(transfer.transactionId)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="View on AlgoExplorer"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
            {copiedField === 'txId' && (
              <span className="text-xs text-green-600">Copied!</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (canReclaim || canRelease) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            {canReclaim && onReclaim && (
              <button
                onClick={onReclaim}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
              >
                <RotateCcw className="h-4 w-4 inline mr-1" />
                Reclaim Funds
              </button>
            )}
            {canRelease && onRelease && (
              <button
                onClick={onRelease}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <CheckCircle className="h-4 w-4 inline mr-1" />
                Release to Recipient
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {transfer.status === 'active' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            {remainingTime > 0 
              ? `You can reclaim your funds for ${formatRemainingTime(remainingTime)} more.`
              : 'The protection period has expired. Funds can now be released to the recipient.'
            }
          </p>
        </div>
      )}

      {transfer.status === 'completed' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Funds have been successfully released to the recipient.
          </p>
        </div>
      )}

      {transfer.status === 'reclaimed' && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">
            🔄 Funds have been reclaimed by the sender.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransferStatus;