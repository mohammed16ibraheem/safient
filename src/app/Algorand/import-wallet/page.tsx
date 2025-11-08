'use client';

import { useState } from 'react';
import { ArrowLeft, Wallet, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MnemonicInput from './components/MnemonicInput';
import ValidationStatus from './components/ValidationStatus';
import ImportProgress from './components/ImportProgress';

import algosdk from 'algosdk';

interface ValidationResult {
  isValid: boolean;
  address?: string;
  error?: string;
}

interface ImportStatus {
  step: 'input' | 'validating' | 'importing' | 'success' | 'error';
  message: string;
  progress: number;
}

export default function ImportWallet() {
  const router = useRouter();
  const [mnemonicWords, setMnemonicWords] = useState<string[]>(new Array(25).fill(''));
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    step: 'input',
    message: 'Enter your 24 recovery phrases',
    progress: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMnemonicChange = (words: string[]) => {
    setMnemonicWords(words);
    setValidationResult(null);
    setImportStatus({
      step: 'input',
      message: 'Enter your 24 recovery phrases',
      progress: 0
    });
  };

  const validateMnemonic = async () => {
    const mnemonicPhrase = mnemonicWords.join(' ').trim();
    
    if (mnemonicWords.some(word => !word.trim())) {
      setValidationResult({
        isValid: false,
        error: 'Please fill in all 25 words'
      });
      return;
    }

    setIsProcessing(true);
    setImportStatus({
      step: 'validating',
      message: 'Validating mnemonic phrase...',
      progress: 25
    });

    try {
      const response = await fetch('/Algorand/api/validate-mnemonic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mnemonic: mnemonicPhrase }),
      });

      const result = await response.json();

      if (result.success) {
        setValidationResult({
          isValid: true,
          address: result.address
        });
        setImportStatus({
          step: 'validating',
          message: 'Mnemonic validated successfully!',
          progress: 50
        });
      } else {
        setValidationResult({
          isValid: false,
          error: result.error || 'Invalid mnemonic phrase'
        });
        setImportStatus({
          step: 'error',
          message: result.error || 'Invalid mnemonic phrase',
          progress: 0
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: 'Network error. Please try again.'
      });
      setImportStatus({
        step: 'error',
        message: 'Network error. Please try again.',
        progress: 0
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const importWallet = async () => {
    if (!validationResult?.isValid || !validationResult.address) return;

    setIsProcessing(true);
    setImportStatus({
      step: 'importing',
      message: 'Importing wallet and verifying on testnet...',
      progress: 75
    });

    try {
      const response = await fetch('/Algorand/api/import-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mnemonic: mnemonicWords.join(' '),
          address: validationResult.address
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Double-verify with Algorand SDK before storing
        try {
          const account = algosdk.mnemonicToSecretKey(mnemonicWords.join(' ').trim().toLowerCase());
          const derivedAddress = account.addr.toString();
          
          // Confirm the address matches what we expect
          if (derivedAddress === validationResult.address) {
            // Store imported wallet in localStorage to make it the active wallet
            localStorage.setItem('algorand_address', validationResult.address);
            localStorage.setItem('algorand_mnemonic', mnemonicWords.join(' '));
            
            console.log('✅ Wallet verified and stored:', {
              address: validationResult.address,
              derivedAddress: derivedAddress,
              match: derivedAddress === validationResult.address
            });
          } else {
            console.error('❌ Address mismatch after import:', {
              expected: validationResult.address,
              derived: derivedAddress
            });
            throw new Error('Address verification failed after import');
          }
        } catch (verificationError) {
          console.error('❌ SDK verification failed:', verificationError);
          setImportStatus({
            step: 'error',
            message: 'Wallet verification failed after import',
            progress: 0
          });
          return;
        }
        
        setImportStatus({
          step: 'success',
          message: 'Wallet imported and verified successfully!',
          progress: 100
        });
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/Algorand/dashboard');
        }, 2000);
      } else {
        setImportStatus({
          step: 'error',
          message: result.error || 'Failed to import wallet',
          progress: 0
        });
      }
    } catch (error) {
      setImportStatus({
        step: 'error',
        message: 'Network error during import. Please try again.',
        progress: 0
      });
    } finally {
      setIsProcessing(false);
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
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium mb-6">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Import Algorand Wallet
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Import Your Wallet
            </h1>
            <p className="text-gray-400 text-lg">
              Enter your 24-word recovery phrase to import your Algorand wallet
            </p>
          </div>

          {/* Import Form */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-8 max-w-3xl mx-auto">
            {/* Progress */}
            <ImportProgress status={importStatus} />
            
            {/* Mnemonic Input */}
            <MnemonicInput 
              words={mnemonicWords}
              onChange={handleMnemonicChange}
              disabled={isProcessing}
            />
            
            {/* Validation Status */}
            {validationResult && (
              <ValidationStatus result={validationResult} />
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
              {!validationResult?.isValid ? (
                <button
                  onClick={validateMnemonic}
                  disabled={isProcessing || mnemonicWords.some(word => !word.trim())}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate Mnemonic'
                  )}
                </button>
              ) : (
                <button
                  onClick={importWallet}
                  disabled={isProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Wallet'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}