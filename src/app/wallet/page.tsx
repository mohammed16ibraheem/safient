'use client';

import { useState } from 'react';
import { Shield, Wallet, ArrowRight, ChevronDown, Fingerprint, Clock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Footer from '../footer/page';

interface CryptoToken {
  id: string;
  name: string;
  symbol: string;
  available: boolean;
}

export default function WalletPage() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedToken, setSelectedToken] = useState<CryptoToken | null>(null);
  const [showThumbprintProcess, setShowThumbprintProcess] = useState(false);

  // Crypto tokens from the public/crypto-icon folder
  const cryptoTokens: CryptoToken[] = [
    { id: '1inch', name: '1inch Protocol', symbol: '1INCH', available: false },
    { id: 'ada', name: 'Cardano', symbol: 'ADA', available: false },
    { id: 'algo', name: 'Algorand', symbol: 'ALGO', available: true }, // Only ALGO is available
    { id: 'atom', name: 'Cosmos', symbol: 'ATOM', available: false },
    { id: 'avax', name: 'Avalanche', symbol: 'AVAX', available: false },
    { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', available: false },
    { id: 'comp', name: 'Compound', symbol: 'COMP', available: false },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', available: false },
    { id: 'ksm', name: 'Kusama', symbol: 'KSM', available: false },
    { id: 'ltc', name: 'Litecoin', symbol: 'LTC', available: false },
    { id: 'mana', name: 'Decentraland', symbol: 'MANA', available: false },
    { id: 'sand', name: 'The Sandbox', symbol: 'SAND', available: false },
    { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', available: false },
    { id: 'sol', name: 'Solana', symbol: 'SOL', available: false },
    { id: 'theta', name: 'Theta Network', symbol: 'THETA', available: false },
    { id: 'trx', name: 'TRON', symbol: 'TRX', available: false }
  ].sort((a, b) => a.symbol.localeCompare(b.symbol));

  const handleCreateWallet = () => {
    setSelectedOption('create');
    setShowDropdown(true);
  };

  const handleThumbprint = () => {
    setSelectedOption('thumbprint');
    setShowThumbprintProcess(true);
  };

  const handleTokenSelect = (token: CryptoToken) => {
    if (token.available) {
      setSelectedToken(token);
    }
  };

  const handleNext = () => {
    if (selectedToken?.id === 'algo') {
      router.push('/Algorand/create-wallet');
    }
  };

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/crypto-icon/eth.png';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-lg border-b border-gray-800/50 flex items-center justify-between h-16 px-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowRight className="h-5 w-5 rotate-180 mr-2" />
          Back
        </button>
        <div className="flex items-center">
          <div className="h-9 w-9 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg flex items-center justify-center mr-2 transform rotate-12">
            <Wallet className="h-5 w-5 text-white transform -rotate-12" />
          </div>
          <span className="font-heading text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Safient
          </span>
        </div>
        <div className="w-16"></div> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-500/30 mb-4">
              <Shield className="h-3.5 w-3.5 text-blue-400 mr-2" />
              <span className="font-heading text-sm font-medium text-blue-400">Secure Wallet Setup</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Choose Your Setup Method
            </h1>
            <p className="font-body text-lg text-gray-300">
              Select how you'd like to create your secure wallet
            </p>
          </div>

          {/* Options */}
          {!selectedOption && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* Create Wallet Option */}
              <div 
                onClick={handleCreateWallet}
                className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800/80 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group hover:scale-105"
              >
                <div className="text-center">
                  <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Wallet className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-2">Create Wallet</h3>
                  <p className="font-body text-gray-400 text-sm">
                    Generate a new secure wallet with AI protection
                  </p>
                </div>
              </div>

              {/* Thumbprint Option */}
              <div 
                onClick={handleThumbprint}
                className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800/80 hover:border-violet-500/50 transition-all duration-300 cursor-pointer group hover:scale-105"
              >
                <div className="text-center">
                  <div className="h-16 w-16 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Fingerprint className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-2">Thumbprint</h3>
                  <p className="font-body text-gray-400 text-sm">
                    Use biometric authentication for wallet access
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Thumbprint Under Process */}
          {showThumbprintProcess && (
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 border border-gray-800/80 text-center">
              <div className="h-20 w-20 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Fingerprint className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-4">Under Process</h3>
              <p className="font-body text-gray-300 mb-6">
                Thumbprint authentication is currently being implemented. This feature will be available soon.
              </p>
              <div className="flex items-center justify-center space-x-2 text-violet-400">
                <Clock className="h-5 w-5 animate-spin" />
                <span className="font-body text-sm">Processing...</span>
              </div>
            </div>
          )}

          {/* Crypto Token Dropdown */}
          {showDropdown && (
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800/80">
              {/* REMOVED: Close button - dropdown stays open */}
              <div className="mb-6">
                <h3 className="font-heading text-xl font-bold">Select Cryptocurrency</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {cryptoTokens.map((token) => (
                  <div
                    key={token.id}
                    onClick={() => handleTokenSelect(token)}
                    className={`relative bg-gray-800/50 rounded-lg p-4 border transition-all duration-300 ${
                      token.available 
                        ? 'border-gray-700 hover:border-green-500/50 cursor-pointer hover:scale-105' 
                        : 'border-gray-800 cursor-not-allowed opacity-60'
                    } ${selectedToken?.id === token.id ? 'border-green-500 bg-green-900/20' : ''}`}
                  >
                    {/* Status Dot */}
                    <div className={`absolute -top-2 -right-2 h-4 w-4 rounded-full border-2 border-gray-900 ${
                      token.available ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    
                    <div className="text-center">
                      <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                        <img 
                          src={`/crypto-icon/${token.id}.png`}
                          alt={token.name}
                          className="h-8 w-8 object-contain"
                          onError={handleImgError}
                          draggable={false}
                        />
                      </div>
                      <h4 className="font-heading text-sm font-bold text-white">{token.symbol}</h4>
                      <p className="font-body text-xs text-gray-400 truncate">{token.name}</p>
                      {!token.available && (
                        <p className="font-body text-xs text-red-400 mt-1">Under Process</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Selected Token and Next Button */}
              {selectedToken && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
                        <img 
                          src={`/crypto-icon/${selectedToken.id}.png`}
                          alt={selectedToken.name}
                          className="h-6 w-6 object-contain"
                          onError={handleImgError}
                          draggable={false}
                        />
                      </div>
                      <div>
                        <h4 className="font-heading text-lg font-bold text-white">{selectedToken.symbol}</h4>
                        <p className="font-body text-sm text-gray-400">{selectedToken.name}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    
                    <button
                      onClick={handleNext}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-heading font-medium rounded-xl shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105 flex items-center"
                    >
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Footer Component - Same as homepage */}
      <Footer />
    </div>
  );
}