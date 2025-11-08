'use client';

import { CheckCircle, AlertCircle, Copy } from 'lucide-react';
import { useState } from 'react';

interface ValidationResult {
  isValid: boolean;
  address?: string;
  error?: string;
}

interface ValidationStatusProps {
  result: ValidationResult;
}

export default function ValidationStatus({ result }: ValidationStatusProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (result.address) {
      try {
        await navigator.clipboard.writeText(result.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  if (result.isValid && result.address) {
    return (
      <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-green-400 font-semibold mb-2">Mnemonic Valid!</h3>
            <p className="text-gray-300 text-sm mb-3">
              Your recovery phrase is valid and corresponds to the following Algorand address:
            </p>
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Wallet Address</p>
                  <p className="text-white font-mono text-sm break-all">
                    {result.address}
                  </p>
                </div>
                <button
                  onClick={copyAddress}
                  className="ml-3 p-2 text-gray-400 hover:text-white transition-colors"
                  title="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            {copied && (
              <p className="text-green-400 text-xs mt-2">Address copied to clipboard!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!result.isValid && result.error) {
    return (
      <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-red-400 font-semibold mb-2">Validation Failed</h3>
            <p className="text-gray-300 text-sm">
              {result.error}
            </p>
            <div className="mt-3 text-xs text-gray-400">
              <p>Please check that:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>All 24 words are entered correctly</li>
                <li>Words are from the BIP39 wordlist</li>
                <li>Words are in the correct order</li>
                <li>No extra spaces or characters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}