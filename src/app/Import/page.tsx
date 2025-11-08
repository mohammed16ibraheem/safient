'use client';

import { useState } from 'react';
import { ArrowLeft, Wallet, Fingerprint, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type SetupMethod = 'create' | 'thumbprint' | null;
type Cryptocurrency = {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  status: 'available' | 'under-process';
};

const cryptocurrencies: Cryptocurrency[] = [
  { id: '1inch', name: '1inch Protocol', symbol: '1INCH', icon: '/crypto-icon/1inch.png', status: 'under-process' },
  { id: 'ada', name: 'Cardano', symbol: 'ADA', icon: '/crypto-icon/ada.png', status: 'under-process' },
  { id: 'algo', name: 'Algorand', symbol: 'ALGO', icon: '/crypto-icon/algo.png', status: 'available' },
  { id: 'atom', name: 'Cosmos', symbol: 'ATOM', icon: '/crypto-icon/atom.png', status: 'under-process' },
  { id: 'avax', name: 'Avalanche', symbol: 'AVAX', icon: '/crypto-icon/avax.png', status: 'under-process' },
  { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', icon: '/crypto-icon/bnb.png', status: 'under-process' },
  { id: 'comp', name: 'Compound', symbol: 'COMP', icon: '/crypto-icon/comp.png', status: 'under-process' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: '/crypto-icon/eth.png', status: 'under-process' },
  { id: 'ksm', name: 'Kusama', symbol: 'KSM', icon: '/crypto-icon/ksm.png', status: 'under-process' },
  { id: 'ltc', name: 'Litecoin', symbol: 'LTC', icon: '/crypto-icon/ltc.png', status: 'under-process' },
  { id: 'mana', name: 'Decentraland', symbol: 'MANA', icon: '/crypto-icon/mana.png', status: 'under-process' },
  { id: 'sand', name: 'The Sandbox', symbol: 'SAND', icon: '/crypto-icon/sand.png', status: 'under-process' },
  { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', icon: '/crypto-icon/shib.png', status: 'under-process' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', icon: '/crypto-icon/sol.png', status: 'under-process' },
  { id: 'theta', name: 'Theta', symbol: 'THETA', icon: '/crypto-icon/theta.png', status: 'under-process' },
  { id: 'trx', name: 'TRON', symbol: 'TRX', icon: '/crypto-icon/trx.png', status: 'under-process' }
];

export default function ImportWallet() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState<SetupMethod>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);

  const handleMethodSelect = (method: SetupMethod) => {
    setSelectedMethod(method);
    if (method === 'thumbprint') {
      setCurrentStep(3); // Go to thumbprint under process screen
    } else {
      setCurrentStep(2); // Go to crypto selection for import wallet
    }
  };

  const handleCryptoSelect = (cryptoId: string) => {
    setSelectedCrypto(cryptoId);
    if (cryptoId === 'algo') {
      // Redirect to Algorand import wallet page
      router.push('/Algorand/import-wallet');
    }
  };

  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium mb-6">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
          Secure Wallet Setup
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Setup Method
        </h1>
        <p className="text-gray-400 text-lg">
          Select how you'd like to create your secure wallet
        </p>
      </div>

      {/* Setup Options */}
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {/* Create Wallet */}
        <button
          onClick={() => handleMethodSelect('create')}
          className="group p-8 bg-gray-800/50 border border-gray-700/50 rounded-2xl hover:border-blue-500/50 hover:bg-gray-800/70 transition-all duration-300 text-center"
        >
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500 transition-colors">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Import Wallet
          </h3>
          <p className="text-gray-400">
            Enter your 24 recovery phrases with AI protection
          </p>
        </button>

        {/* Thumbprint */}
        <button
          onClick={() => handleMethodSelect('thumbprint')}
          className="group p-8 bg-gray-800/50 border border-gray-700/50 rounded-2xl hover:border-purple-500/50 hover:bg-gray-800/70 transition-all duration-300 text-center"
        >
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-500 transition-colors">
            <Fingerprint className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Thumbprint Access
          </h3>
          <p className="text-gray-400">
            Scan your thumb and get access to your wallet
          </p>
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium mb-6">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
          Secure Wallet Setup
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Setup Method
        </h1>
        <p className="text-gray-400 text-lg">
          Select how you'd like to create your secure wallet
        </p>
      </div>

      {/* Cryptocurrency Selection */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8">
        <h2 className="text-2xl font-semibold text-white mb-8">
          Select Cryptocurrency
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cryptocurrencies.map((crypto) => (
            <button
              key={crypto.id}
              onClick={() => handleCryptoSelect(crypto.id)}
              disabled={crypto.status === 'under-process'}
              className={`
                relative p-6 rounded-xl border transition-all duration-300 text-center
                ${
                  selectedCrypto === crypto.id
                    ? 'border-green-500 bg-green-500/10'
                    : crypto.status === 'available'
                    ? 'border-gray-600 bg-gray-800/50 hover:border-green-500/50 hover:bg-gray-700/50'
                    : 'border-gray-700 bg-gray-800/30 opacity-60 cursor-not-allowed'
                }
              `}
            >
              {/* Status Indicator */}
              <div className="absolute top-3 right-3">
                {crypto.status === 'available' ? (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                )}
              </div>

              {/* Crypto Icon */}
              <div className="w-12 h-12 mx-auto mb-3 relative">
                <Image
                  src={crypto.icon}
                  alt={crypto.name}
                  fill
                  sizes="48px"
                  className="object-contain"
                />
              </div>

              {/* Crypto Info */}
              <h3 className="font-semibold text-white text-sm mb-1">
                {crypto.symbol}
              </h3>
              <p className="text-xs text-gray-400 mb-2">
                {crypto.name}
              </p>
              
              {/* Status Text */}
              <p className={`text-xs ${
                crypto.status === 'available' ? 'text-green-400' : 'text-red-400'
              }`}>
                {crypto.status === 'available' ? 'Available' : 'Under Process'}
              </p>

              {/* Selected Indicator */}
              {selectedCrypto === crypto.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-xl">
                  {/* <Check className="h-8 w-8 text-green-400" /> */}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Selected Crypto Info */}
        {selectedCrypto && (
          <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <p className="text-green-400 text-center">
              {selectedCrypto === 'algo' 
                ? '✅ ALGO selected!'
                : `${cryptocurrencies.find(c => c.id === selectedCrypto)?.symbol} selected`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium mb-6">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
          Secure Wallet Setup
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your Setup Method
        </h1>
        <p className="text-gray-400 text-lg">
          Select how you'd like to create your secure wallet
        </p>
      </div>

      {/* Under Process Screen */}
      <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-12 text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <Fingerprint className="h-12 w-12 text-white" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-6">
          Under Process
        </h2>
        
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          Thumbprint authentication is currently being implemented. This feature will be available soon.
        </p>
        
        <div className="flex items-center justify-center text-purple-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400 mr-3"></div>
          <span className="text-lg font-medium">Processing...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-lg border-b border-gray-800/50 flex items-center justify-between h-16 px-4">
        <button 
          onClick={() => {
            if (currentStep > 1) {
              setCurrentStep(currentStep - 1);
              if (currentStep === 3) {
                setCurrentStep(1); // Go back to step 1 from thumbprint screen
              }
            } else {
              router.back();
            }
          }}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
        
        <div className="flex items-center">
          <div className="h-9 w-9 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg flex items-center justify-center mr-2 transform rotate-12">
            <Wallet className="h-5 w-5 text-white transform -rotate-12" />
          </div>
          <span className="font-mono font-bold text-xl text-white tracking-wider">
            Safient
          </span>
        </div>
        
        <div className="w-16"></div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 pb-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </main>
    </div>
  );
}