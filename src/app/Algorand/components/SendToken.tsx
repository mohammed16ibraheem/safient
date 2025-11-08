'use client';

import React, { useState } from 'react';
import SafientAIVerification from './safient-ai-verification';
import TransactionHistory from './TransactionHistory';

interface SendTokenProps {
  userAddress?: string;
  balance?: number;
}

const SendToken: React.FC<SendTokenProps> = ({ userAddress, balance = 8.898000 }) => {
  const [step, setStep] = useState<'form' | 'verification' | 'history'>('form');
  const [formData, setFormData] = useState({
    recipient: '573NTREKJYGQE6RN34VBV2YIV3PAJGTHNWG6W6MR4LR2JI5LXJUCFTMOXQ',
    amount: '1'
  });

  const handleSafientAIClick = () => {
    setStep('verification');
  };

  const handleVerificationComplete = (_result: 'safe' | 'risky') => {
    setStep('history');
  };

  if (step === 'verification') {
    return (
      <SafientAIVerification
        recipientAddress={formData.recipient}
        amount={parseFloat(formData.amount)}
        onVerificationComplete={handleVerificationComplete}
        onCancel={() => setStep('form')}
      />
    );
  }

  if (step === 'history') {
    return (
      <TransactionHistory
        userAddress={userAddress}
      />
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      {/* Navigation */}
      <div className="flex border-b border-gray-700">
        <button className="flex-1 py-3 px-4 text-gray-400">Overview</button>
        <button className="flex-1 py-3 px-4 bg-blue-600 text-white">Send</button>
        <button className="flex-1 py-3 px-4 text-gray-400">Receive</button>
        <button 
          className="flex-1 py-3 px-4 text-gray-400"
          onClick={() => setStep('history')}
        >
          History
        </button>
      </div>

      {/* Send Form */}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Send ALGO</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Recipient Address</label>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm mb-2">Amount (ALGO)</label>
            <div className="relative">
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
              />
              <button className="absolute right-3 top-3 text-blue-400 text-sm">
                Use Max
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-1">Available: {balance} ALGO</p>
          </div>
        </div>

        {/* Safient AI Protection Button */}
        <button
          onClick={handleSafientAIClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-4 rounded-lg font-medium mt-6 flex items-center justify-center"
        >
          🛡️ Safient AI
        </button>
      </div>
    </div>
  );
};

export default SendToken;