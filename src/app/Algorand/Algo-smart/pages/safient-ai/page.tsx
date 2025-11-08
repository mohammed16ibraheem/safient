'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  ShieldCheck, 
  Clock, 
  Users,
  DollarSign,
  Sparkles
} from 'lucide-react';
import SafientAIEscrow from '../../components/SafientAIEscrow';
import TransferStatus from '../../components/TransferStatus';
import { SafientAITransfer } from '../../types/safient-ai';

interface WalletData {
  address: string;
  mnemonic: string;
  creationDate: string;
  network: string;
}

const SafientAIPage: React.FC = () => {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'intro' | 'create' | 'manage'>('intro');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [userTransfers, setUserTransfers] = useState<SafientAITransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const response = await fetch('/Algorand/api/load-wallet-data');
      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentView === 'create' || currentView === 'manage') {
      setCurrentView('intro');
    } else {
      router.push('/Algorand/dashboard');
    }
  };

  const renderIntro = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="text-right">
            <div className="text-sm text-gray-600">Connected Wallet</div>
            <div className="font-mono text-sm text-gray-800">
              {walletData ? `${walletData.address.slice(0, 8)}...${walletData.address.slice(-8)}` : 'Loading...'}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-full shadow-lg">
              <Sparkles className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Safient AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Send cryptocurrency with built-in protection. Your funds are secured by smart contracts 
            and you maintain control with the ability to reclaim them.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Protected Transfers</h3>
            <p className="text-gray-600">
              Your funds are held securely in a smart contract. You can reclaim them anytime during the protection period.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Time-Locked Security</h3>
            <p className="text-gray-600">
              Set a protection period from 5 minutes to 24 hours. After expiration, funds automatically release to the recipient.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Decentralized Trust</h3>
            <p className="text-gray-600">
              No intermediaries required. Everything is handled automatically by the Algorand blockchain.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How Safient AI Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Transfer</h3>
              <p className="text-gray-600">
                Enter recipient address, amount, and protection period. Your funds are locked in a smart contract.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Protection Period</h3>
              <p className="text-gray-600">
                During this time, you can reclaim your funds if needed. The recipient cannot access them yet.
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Automatic Release</h3>
              <p className="text-gray-600">
                After the protection period expires, funds are automatically released to the recipient.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setCurrentView('create')}
            disabled={!walletData}
            className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            <DollarSign className="h-6 w-6 inline mr-2" />
            Create Safient AI Transfer
          </button>
          
          <button
            onClick={() => setCurrentView('manage')}
            disabled={!walletData}
            className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
          >
            <ShieldCheck className="h-6 w-6 inline mr-2" />
            Manage Transfers
          </button>
        </div>

        {!walletData && !isLoading && (
          <div className="mt-8 text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
              <p className="text-yellow-800">
                ⚠️ Please connect your wallet to use Safient AI
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCreate = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <SafientAIEscrow
          onBack={handleBack}
          userWalletAddress={walletData?.address}
          userMnemonic={walletData?.mnemonic}
        />
      </div>
    </div>
  );

  const renderManage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Intro</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Manage Transfers</h1>
          <div></div>
        </div>
    
        {/* Transfers List */}
        <div className="space-y-6">
          {userTransfers.length === 0 ? (
            <div className="bg-white rounded-xl p-8 shadow-lg text-center">
              <ShieldCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transfers Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't created any Safient AI transfers yet.
              </p>
              <button
                onClick={() => setCurrentView('create')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Transfer
              </button>
            </div>
          ) : (
            userTransfers.map((transfer) => (
              <TransferStatus
                key={transfer.id}
                transfer={transfer}
                showActions={true}
                onReclaim={() => {
                  // Handle reclaim
                  console.log('Reclaim transfer:', transfer.id);
                }}
                onRelease={() => {
                  // Handle release
                  console.log('Release transfer:', transfer.id);
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Safient AI...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === 'intro' && renderIntro()}
      {currentView === 'create' && renderCreate()}
      {currentView === 'manage' && renderManage()}
    </>
  );
};

export default SafientAIPage;
// Update all remaining references:
// ChevronLeftIcon → ChevronLeft
// SparklesIcon → Sparkles
// ClockIcon → Clock