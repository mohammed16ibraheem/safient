'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ShieldCheck, Clock, User, DollarSign } from 'lucide-react';

interface SafientAIEscrowProps {
  onBack?: () => void;
  userWalletAddress?: string;
  userMnemonic?: string;
}

const SafientAIEscrow: React.FC<SafientAIEscrowProps> = ({
  onBack,
  userWalletAddress,
  userMnemonic
}) => {
  const [currentStep, setCurrentStep] = useState<'form' | 'creating' | 'success' | 'error'>('form');
  const [formData, setFormData] = useState({
    recipientAddress: '',
    amount: '',
    lockDurationMinutes: '30',
    purpose: ''
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdTransfer, setCreatedTransfer] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.recipientAddress) {
      errors.push('Recipient address is required');
    } else if (formData.recipientAddress.length !== 58) {
      errors.push('Invalid Algorand address format');
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }
    
    return errors;
  };

  useEffect(() => {
    setValidationErrors(validateForm());
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateTransfer = async () => {
    if (!userMnemonic) {
      setErrorMessage('Wallet mnemonic not available. Please reconnect your wallet.');
      setCurrentStep('error');
      return;
    }

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsLoading(true);
    setCurrentStep('creating');

    try {
      const transferData = {
        senderMnemonic: userMnemonic,
        recipientAddress: formData.recipientAddress,
        amount: parseFloat(formData.amount),
        isEscrow: true,
        lockDurationMinutes: parseInt(formData.lockDurationMinutes),
        purpose: formData.purpose
      };

      console.log('🚀 Creating Safient AI transfer:', transferData);

      const response = await fetch('/Algorand/Algo-smart/api/create-dynamic-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transferData)
      });

      const result = await response.json();
      console.log('📝 Transfer result:', result);

      if (result.success) {
        const transfer = {
          id: result.transferId,
          transactionId: result.transactionId,
          senderAddress: userWalletAddress,
          recipientAddress: formData.recipientAddress,
          amount: parseFloat(formData.amount),
          lockDurationMinutes: parseInt(formData.lockDurationMinutes),
          createdAt: new Date(),
          expiresAt: new Date(result.expiresAt),
          status: 'escrow_active'
        };

        setCreatedTransfer(transfer);
        setCurrentStep('success');
      } else {
        setErrorMessage(result.error || 'Failed to create Safient AI transfer');
        setCurrentStep('error');
      }
    } catch (error) {
      console.error('Create transfer error:', error);
      setErrorMessage('Network error. Please try again.');
      setCurrentStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Safient AI Transfer</h2>
        <p className="text-gray-600">
          Send funds with built-in protection. You can reclaim your funds within the lock period.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Recipient Address
          </label>
          <input
            type="text"
            value={formData.recipientAddress}
            onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
            placeholder="Enter Algorand address..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4 inline mr-1" />
            Amount (ALGO)
          </label>
          <input
            type="number"
            step="0.000001"
            min="0"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0.000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Lock Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4 inline mr-1" />
            Protection Period (Minutes)
          </label>
          <select
            value={formData.lockDurationMinutes}
            onChange={(e) => handleInputChange('lockDurationMinutes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose (Optional)
          </label>
          <input
            type="text"
            value={formData.purpose}
            onChange={(e) => handleInputChange('purpose', e.target.value)}
            placeholder="What is this transfer for?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-600">
              {validationErrors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How Safient AI Works:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Funds are sent to recipient but marked as protected</li>
            <li>• You can reclaim your funds anytime during the protection period</li>
            <li>• After the period expires, the protection is automatically removed</li>
            <li>• Track all your protected transfers in the transaction history</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 inline mr-1" />
            Back
          </button>
        )}
        <button
          onClick={handleCreateTransfer}
          disabled={validationErrors.length > 0 || isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating...' : 'Create Safient AI Transfer'}
        </button>
      </div>
    </div>
  );

  const renderCreating = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Creating Safient AI Transfer</h3>
        <p className="text-gray-600">Please wait while we process your transaction...</p>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-green-100 rounded-full">
          <ShieldCheck className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Transfer Created Successfully!</h3>
      <p className="text-gray-600">Your Safient AI transfer is now active. Check your transaction history to manage it.</p>
      
      {createdTransfer && (
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <h4 className="font-medium text-gray-900 mb-2">Transfer Details:</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Transfer ID: {createdTransfer.id}</div>
            <div>Transaction ID: {createdTransfer.transactionId}</div>
            <div>Amount: {createdTransfer.amount} ALGO</div>
            <div>Protection Period: {createdTransfer.lockDurationMinutes} minutes</div>
          </div>
        </div>
      )}
      
      <button
        onClick={onBack}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-red-100 rounded-full">
          <ShieldCheck className="h-8 w-8 text-red-600" />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Transfer Failed</h3>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
      </div>
      <button
        onClick={() => setCurrentStep('form')}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      {currentStep === 'form' && renderForm()}
      {currentStep === 'creating' && renderCreating()}
      {currentStep === 'success' && renderSuccess()}
      {currentStep === 'error' && renderError()}
    </div>
  );
};

export default SafientAIEscrow;