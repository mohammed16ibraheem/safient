'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  DollarSign
} from 'lucide-react';

interface SafientAIIntegrationProps {
  className?: string;
  variant?: 'card' | 'banner' | 'compact';
}

const SafientAIIntegration: React.FC<SafientAIIntegrationProps> = ({
  className = '',
  variant = 'card'
}) => {
  const router = useRouter();

  const handleNavigateToSafientAI = () => {
    router.push('/Algorand/Algo-smart/pages/safient-ai');
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Introducing Safient AI</h3>
              <p className="text-blue-100">
                Send crypto with built-in protection and reclaim capability
              </p>
            </div>
          </div>
          <button
            onClick={handleNavigateToSafientAI}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center space-x-2"
          >
            <span>Try Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleNavigateToSafientAI}
        className={`w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all group ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Safient AI</div>
              <div className="text-sm text-gray-600">Protected transfers</div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
      </button>
    );
  }

  // Default card variant
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">Safient AI</h3>
        </div>
        <p className="text-blue-100">
          Advanced secure transfer system with time-locked protection
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Features */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="p-1 bg-blue-100 rounded">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Protected Transfers</div>
              <div className="text-sm text-gray-600">
                Send funds with built-in reclaim capability
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-1 bg-green-100 rounded">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Time-Locked Security</div>
              <div className="text-sm text-gray-600">
                Set protection periods from 5 minutes to 24 hours
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-1 bg-purple-100 rounded">
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Automatic Release</div>
              <div className="text-sm text-gray-600">
                Funds automatically release after protection period
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">How it works:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Send funds to a smart contract with protection period</li>
            <li>2. Reclaim your funds anytime during protection period</li>
            <li>3. After expiration, funds automatically release to recipient</li>
          </ol>
        </div>

        {/* Action Button */}
        <button
          onClick={handleNavigateToSafientAI}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center space-x-2"
        >
          <Sparkles className="h-5 w-5" />
          <span>Launch Safient AI</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Powered by Algorand Smart Contracts</span>
          <div className="flex items-center space-x-1 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Live on Testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafientAIIntegration;