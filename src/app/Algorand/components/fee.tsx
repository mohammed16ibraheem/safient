'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface FeeCalculatorProps {
  sendAmount: string;
  balance: number;
  onFeeChange: (feeData: FeeData) => void;
  className?: string;
}

interface FeeData {
  amount: number;
  networkFee: number;
  safientFee: number;
  totalAmount: number;
  maxSendable: number;
  hasInsufficientFunds: boolean;
  escrowAmount: number; // New: Amount that will go to escrow
  canEscrow: boolean; // New: Whether escrow is possible
  validationMessage: string; // New: Smart validation message
}

export default function FeeCalculator({ sendAmount, balance, onFeeChange, className = '' }: FeeCalculatorProps) {
  const [networkFee] = useState(0.001); // Standard Algorand network fee
  const [safientFee] = useState(0.1); // Flat 0.1 ALGO SafientAI fee
  const [minimumBalance] = useState(0.1); // Algorand minimum balance requirement

  // Smart escrow validation calculation
  const calculateEscrowValidation = (): FeeData => {
    const amount = parseFloat(sendAmount) || 0;
    const totalFeesRequired = networkFee + safientFee;
    const totalAmountNeeded = amount + totalFeesRequired;
    
    // Calculate what actually goes to escrow (amount minus network fees)
    const escrowAmount = Math.max(0, amount - networkFee);
    
    // Available balance for transactions (keeping minimum balance)
    const availableBalance = Math.max(0, balance - minimumBalance);
    
    // Check if user can afford the total transaction
    const canAffordTransaction = totalAmountNeeded <= availableBalance;
    
    // Smart validation logic
    let canEscrow = false;
    let validationMessage = '';
    
    if (amount <= 0) {
      validationMessage = 'Enter an amount to see SafientAI preview';
    } else if (amount < 0.123) {
      validationMessage = 'Minimum SafientAI amount is 0.123 ALGO';
    } else if (!canAffordTransaction) {
      const shortfall = totalAmountNeeded - availableBalance;
      validationMessage = `Need ${shortfall.toFixed(6)} ALGO more (${amount.toFixed(6)} + ${totalFeesRequired.toFixed(6)} fees)`;
    } else if (escrowAmount < 0.122) { // 0.123 - 0.001 network fee = 0.122
      validationMessage = 'SafientAI amount must be at least 0.123 ALGO (ensures minimum balance after fees)';
    } else {
      canEscrow = true;
      validationMessage = `Will protect ${escrowAmount.toFixed(6)} ALGO with SafientAI after ${networkFee.toFixed(3)} network fee`;
    }
    
    // Calculate max sendable amount
    const maxSendable = Math.max(0, availableBalance - totalFeesRequired);
    
    return {
      amount,
      networkFee,
      safientFee,
      totalAmount: totalAmountNeeded,
      maxSendable,
      hasInsufficientFunds: !canAffordTransaction,
      escrowAmount,
      canEscrow,
      validationMessage
    };
  };

  const fees = calculateEscrowValidation();
  const hasAmount = parseFloat(sendAmount) > 0;

  // Notify parent component when fees change
  useEffect(() => {
    onFeeChange(fees);
  }, [sendAmount, balance]);

  // Always show the component for real-time feedback
  // Only show if user has entered an amount
  if (!hasAmount) {
    return null;
  }

  return (
    <div className={`bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50 ${className}`}>
      <h3 className="text-white font-semibold mb-4 flex items-center text-sm sm:text-base">
        <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-400 flex-shrink-0" />
        SafientAI Transaction Preview
      </h3>
      
      {/* Smart Validation Status - Only show errors */}
      {!fees.canEscrow && (
        <div className="mb-4 p-3 rounded-lg border bg-red-900/20 border-red-500/30">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-red-300">
                ❌ Cannot Use SafientAI
              </p>
              <p className="mt-1 text-red-400/80">
                {fees.validationMessage}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3 sm:space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
          <span className="text-gray-300 text-sm sm:text-base">Send Amount</span>
          <span className="font-mono text-white text-sm sm:text-base font-medium">{fees.amount.toFixed(6)} ALGO</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
          <span className="text-gray-300 flex items-center text-sm sm:text-base">
            Network Fee
          </span>
          <span className="font-mono text-gray-300 text-sm sm:text-base">-{fees.networkFee.toFixed(6)} ALGO</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-700/30">
          <span className="text-gray-300 flex items-center text-sm sm:text-base">
            SafientAI Fee
          </span>
          <span className="font-mono text-blue-300 text-sm sm:text-base">{fees.safientFee.toFixed(6)} ALGO</span>
        </div>
        
        {/* REMOVED: Amount in Escrow section */}
        
        <div className="flex justify-between items-center py-3 bg-gray-700/30 rounded-lg px-3 sm:px-4">
          <span className="text-white font-semibold text-sm sm:text-base">Total</span>
          <span className="font-mono text-base sm:text-lg font-bold text-green-400">{fees.totalAmount.toFixed(6)} ALGO</span>
        </div>
        
        <div className="text-xs text-gray-400 mt-1">
          <strong>Available for SafientAI:</strong> {Math.max(0, fees.maxSendable).toFixed(6)} ALGO
        </div>
      </div>
    </div>
  );
}

export type { FeeData };
