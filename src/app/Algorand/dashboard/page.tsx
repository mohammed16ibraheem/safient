'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, Send, Download, History, Copy, ExternalLink, RefreshCw, QrCode, CheckCircle, AlertCircle, Link, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as algosdk from 'algosdk';
import { v4 as uuidv4 } from 'uuid';
import SafientAIVerification from '../components/safient-ai-verification';
import FeeCalculator, { type FeeData } from '../components/fee';
import CountdownTimer from '../components/CountdownTimer';

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  address: string;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed' | 'reclaimed' | 'escrowed' | 'completed';
  // SafientAI extensions
  safientProtected?: boolean;
  escrowData?: {
    escrow_address: string;
    expires_at: string;
    created_at: string;
    duration_hours: number;
    can_reclaim: boolean;
    lock_duration_minutes: number;
  };
  transferId?: string;
  autoReleased?: boolean; // Track if auto-released
}

interface WalletData {
  walletAddress: string;
  mnemonicPhrase: string;
  createdAt: string;
  network: string;
}

export default function AlgorandDashboard() {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [mnemonic, setMnemonic] = useState<string>('');
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive' | 'history'>('overview');
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  // Send form states
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  // AI Verification states
  const [showAIVerification, setShowAIVerification] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'safe' | 'risky' | null>(null);
  
  // Fee calculation state
  const [feeData, setFeeData] = useState<FeeData | null>(null);

  // Reclaim states
  const [reclaimingTransfers, setReclaimingTransfers] = useState<Set<string>>(new Set());
  const [reclaimError, setReclaimError] = useState<string>('');
  const [reclaimSuccess, setReclaimSuccess] = useState<string>('');

  // Algorand client for testnet
  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

  useEffect(() => {
    loadWalletData();
    
    // Log mnemonic status for debugging
  }, []);
  
  // Add effect to store mnemonic in localStorage when it changes
  useEffect(() => {
    if (mnemonic && walletAddress) {
      localStorage.setItem('algorand_address', walletAddress);
      localStorage.setItem('algorand_mnemonic', mnemonic);
    }
  }, [mnemonic, walletAddress]);
  
  // Add effect to ensure mnemonic is loaded from localStorage when needed
  useEffect(() => {
    if ((!mnemonic || mnemonic.length === 0) && isConnected) {
      const storedMnemonic = localStorage.getItem('algorand_mnemonic');
      if (storedMnemonic) {
        setMnemonic(storedMnemonic);
      } else {
      }
    }
  }, [mnemonic, isConnected]);

  // Reset send form when switching away from send tab
  useEffect(() => {
    if (activeTab !== 'send') {
      // Reset all send-related states when leaving send tab
      setSendAddress('');
      setSendAmount('');
      setSending(false);
      setSendError('');
      setSendSuccess(false);
      setVerificationResult(null);
      setShowAIVerification(false);
    }
    
    // Clear reclaim messages when switching tabs
    if (activeTab !== 'history') {
      setReclaimError('');
      setReclaimSuccess('');
    }
  }, [activeTab]);

  const loadWalletData = async () => {
    try {
      // First try localStorage (most recent wallet activity)
      const address = localStorage.getItem('algorand_address');
      const mnemonicPhrase = localStorage.getItem('algorand_mnemonic');
      
      
      if (address && mnemonicPhrase && mnemonicPhrase.length > 0) {
        // Set state immediately to ensure mnemonic is available for API calls
        setWalletAddress(address);
        setMnemonic(mnemonicPhrase);
        setIsConnected(true);
        
        // Then fetch data that requires API calls
        await fetchBalance(address);
        await fetchTransactions(address);
        return;
      }
      
      // Fallback to API if localStorage is empty
      const response = await fetch('/Algorand/api/load-wallet-data');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.walletData) {
          setWalletAddress(result.walletData.address);
          setMnemonic(result.walletData.mnemonic);
          await fetchBalance(result.walletData.address);
          await fetchTransactions(result.walletData.address);
          setIsConnected(true);
          return;
        }
      }
      
    } catch (error) {
    } finally {
      setLoading(false);
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
      
      
    } catch (error) {
    }
  };

  const connectWallet = async () => {
    setConnecting(true);
    
    try {
      const address = localStorage.getItem('algorand_address');
      const mnemonicPhrase = localStorage.getItem('algorand_mnemonic');
      
      
      if (address && mnemonicPhrase && mnemonicPhrase.length > 0) {
        // Update state immediately to ensure mnemonic is available for API calls
        setWalletAddress(address);
        setMnemonic(mnemonicPhrase);
        
        const walletData: WalletData = {
          walletAddress: address,
          mnemonicPhrase: mnemonicPhrase,
          createdAt: new Date().toISOString(),
          network: 'testnet'
        };
        
        await saveWalletDataToFile(walletData);
        setIsConnected(true);
      } else {
      }
    } catch (error) {
    } finally {
      setConnecting(false);
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      const accountInfo = await algodClient.accountInformation(address).do();
      setBalance(Number(accountInfo.amount) / 1000000); // Convert microAlgos to Algos
    } catch (error) {
      setBalance(0);
    }
  };

  const fetchTransactions = async (address: string) => {
    try {
      
      // First, try to load SafientAI transactions from local files
      let safientTransactions: any[] = [];
      const safientOnChainHashes = new Set<string>();
      try {
        const safientResponse = await fetch('/Algorand/Algo-smart/api/get-transactions?user=' + address);
        const safientData = await safientResponse.json();
        
        if (safientData.success) {
          safientTransactions = safientData.transactions || [];
          
          // Log each SafientAI transaction for debugging
          safientTransactions.forEach((tx, index) => {
            if (tx.transaction_hash) safientOnChainHashes.add(tx.transaction_hash);
            if (tx.release_transaction_hash) safientOnChainHashes.add(tx.release_transaction_hash);
            if (tx.reclaim_transaction_hash) safientOnChainHashes.add(tx.reclaim_transaction_hash);
          });
        } else {
        }
      } catch (safientError) {
      }
      
      // Then fetch from Algorand indexer for regular transactions
      const indexerClient = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '');
      
      const response = await indexerClient
        .lookupAccountTransactions(address)
        .txType('appl')
        .limit(50)
        .do();
      
      
      let algorandTransactions: Transaction[] = [];
      
      if (response.transactions && response.transactions.length > 0) {
        algorandTransactions = response.transactions
          .filter((txn: any) => {
            return txn.txType === 'pay' && txn.paymentTransaction;
          })
          .map((txn: any) => {
            const paymentTxn = txn.paymentTransaction;
            const amount = paymentTxn.amount || 0;
            
            const isSelfTransaction = txn.sender === address;
            const isReceive = paymentTxn.receiver === address && !isSelfTransaction;
            const transactionType = isSelfTransaction ? 'send' : (isReceive ? 'receive' : 'send');
            const otherAddress = transactionType === 'send' ? paymentTxn.receiver : txn.sender;
            
            return {
              id: txn.id,
              type: transactionType as 'receive' | 'send',
              amount: Number(amount) / 1000000,
              address: otherAddress,
              timestamp: new Date((txn.roundTime || Date.now() / 1000) * 1000),
              status: 'confirmed' as const
            };
          })
          .filter((txn: Transaction) => txn.amount > 0);
      }
      
      
      // Convert SafientAI transactions to dashboard format
      const convertedSafientTransactions: Transaction[] = safientTransactions.map(tx => {
        const isUserSender = tx.sender === address;
        const displayAddress = tx.escrow_data ? tx.original_recipient : (isUserSender ? tx.recipient : tx.sender);
        
        // Ensure proper amount formatting (ALGO units)
        const formattedAmount = typeof tx.amount === 'number' 
          ? Number(tx.amount) / 1_000_000
          : 0;
        
        // Map escrow status properly
        let displayStatus: 'confirmed' | 'pending' | 'failed' | 'reclaimed' | 'escrowed' | 'completed' = 'confirmed';
        if (tx.status === 'escrowed') {
          displayStatus = 'escrowed'; // Keep as escrowed for proper button logic
        } else if (tx.status === 'pending') {
          displayStatus = 'pending';
        } else if (tx.status === 'failed') {
          displayStatus = 'failed';
        } else if (tx.status === 'reclaimed') {
          displayStatus = 'reclaimed';
        } else if (tx.status === 'completed') {
          displayStatus = 'completed'; // Keep as completed to show auto-release
        } else {
          // For SafientAI transactions that are completed but still reclaimable
          displayStatus = tx.escrow_data && tx.escrow_data.can_reclaim ? 'escrowed' : 'confirmed';
        }
        
        
        return {
          id: tx.transaction_id,
          type: isUserSender ? 'send' : 'receive',
          amount: formattedAmount,
          address: displayAddress || 'Unknown Address',
          timestamp: new Date(tx.timestamp),
          status: displayStatus,
          // Add SafientAI specific data
          safientProtected: tx.type === 'safient_ai_transfer',
          escrowData: tx.escrow_data,
          transferId: tx.transfer_id,
          autoReleased: tx.auto_released || false
        } as Transaction;
      });
      
      // Combine and sort all transactions with deduplication
      const deduplicatedAlgorandTxs = algorandTransactions.filter(tx => !safientOnChainHashes.has(tx.id));

      const allTransactions = [...convertedSafientTransactions, ...deduplicatedAlgorandTxs]
        .filter(tx => (tx as any).safientProtected)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 6);
      
      
      setTransactions(allTransactions);
      
    } catch (error) {
      
      // Fallback: try to show account balance as faucet transaction
      try {
        const accountInfo = await algodClient.accountInformation(address).do();
        if (accountInfo.amount > 0 && transactions.length === 0) {
          const faucetTxn: Transaction = {
            id: 'faucet-' + Date.now(),
            type: 'receive' as const,
            amount: Number(accountInfo.amount) / 1000000,
            address: 'Algorand Testnet Faucet',
            timestamp: new Date(),
            status: 'confirmed' as const
          };
          setTransactions([faucetTxn]);
        }
      } catch (fallbackError) {
        setTransactions([]);
      }
    }
  };

  const refreshBalance = async () => {
    setRefreshing(true);
    await fetchBalance(walletAddress);
    await fetchTransactions(walletAddress);
    setRefreshing(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
    }
  };

  // AI Verification handlers - enhanced with smart validation
  const handleSafientAI = () => {
    if (!sendAddress || !sendAmount) {
      setSendError('Please enter recipient address and amount');
      return;
    }
    
    // Use smart validation from FeeCalculator
    if (feeData && !feeData.canEscrow) {
      setSendError(feeData.validationMessage || 'Cannot create SafientAI protection with this amount');
      return;
    }
    
    setSendError('');
    setShowAIVerification(true);
  };

  const handleVerificationComplete = async (result: 'safe' | 'risky') => {
    setShowAIVerification(false);
    setSending(true);
    setSendError('');
    setSendSuccess(false);
    
    // Enhanced mnemonic validation with multiple fallback attempts
    let mnemonicToUse = mnemonic;
    
    // First attempt: Check current state
    if (!mnemonicToUse || mnemonicToUse.length === 0) {
      // Second attempt: Get from localStorage
      const storedMnemonic = localStorage.getItem('algorand_mnemonic');
      if (storedMnemonic && storedMnemonic.length > 0) {
        mnemonicToUse = storedMnemonic;
        setMnemonic(storedMnemonic);
      }
    }
    
    // Third attempt: Force reload wallet data if still no mnemonic
    if (!mnemonicToUse || mnemonicToUse.length === 0) {
      try {
        await loadWalletData();
        mnemonicToUse = localStorage.getItem('algorand_mnemonic') || '';
      } catch (error) {
      }
    }
    
    // Final validation
    if (!mnemonicToUse || mnemonicToUse.length === 0) {
      setSendError('Wallet mnemonic not available. Please reconnect your wallet.');
      setSending(false);
      return;
    }
    
    
    
    
    
    
    
    try {
      // Add a unique identifier to prevent duplicate submissions
      const transactionUUID = uuidv4();
      
      const response = await fetch('/Algorand/Algo-smart/api/create-dynamic-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionUUID, // Add this to prevent duplicates
          senderMnemonic: mnemonicToUse,
          recipientAddress: sendAddress,
          amount: Math.round(parseFloat(sendAmount) * 1000000),
          transferType: 'escrow',
          escrowDuration: 0.5,
          purpose: 'escrow_transfer'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSendSuccess(true);
        setSendAddress('');
        setSendAmount('');
        setVerificationResult(null);
        
        // Add delay before refreshing to ensure transaction is processed
        setTimeout(async () => {
          await fetchBalance(walletAddress);
          await fetchTransactions(walletAddress);
        }, 2000);
      } else {
        throw new Error(result.error || 'SafientAI transfer failed');
      }
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'SafientAI transfer failed');
    } finally {
      setSending(false);
    }
  };

  const handleVerificationCancel = () => {
    // Return to send form when cancel is clicked
    setShowAIVerification(false);
    setVerificationResult(null);
    // Keep the form data (sendAddress and sendAmount) so user can modify if needed
  };

  // Add the missing sendTransaction function
  const sendTransaction = async () => {
    if (!sendAddress || !sendAmount) {
      throw new Error('Missing recipient address or amount');
    }
    
    // Get the latest mnemonic from localStorage to ensure we have the most recent value
    const storedMnemonic = localStorage.getItem('algorand_mnemonic');
    
    // Validate mnemonic is available before proceeding
    if ((!storedMnemonic || storedMnemonic.length === 0) && (!mnemonic || mnemonic.length === 0)) {
      throw new Error('Wallet mnemonic not available. Please reconnect your wallet.');
    }
    
    // Update the mnemonic state with the latest value from localStorage
    if (storedMnemonic && storedMnemonic.length > 0 && (!mnemonic || storedMnemonic !== mnemonic)) {
      setMnemonic(storedMnemonic);
    }
    
    // Ensure we have a valid mnemonic to use
    const mnemonicToUse = storedMnemonic || mnemonic;
    if (!mnemonicToUse || mnemonicToUse.length === 0) {
      throw new Error('Unable to access wallet credentials. Please reconnect your wallet.');
    }
    

    // Validate balance including fees
    if (feeData && (feeData.totalAmount ?? 0) > balance) {
      throw new Error(`Insufficient funds. Total required: ${feeData.totalAmount.toFixed(6)} ALGO`);
    }

    try {
      // Create account from mnemonic
      const account = algosdk.mnemonicToSecretKey(mnemonicToUse);
      
      // Get suggested transaction parameters
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Convert amount to microAlgos (1 ALGO = 1,000,000 microAlgos)
      const amountInMicroAlgos = Math.round(parseFloat(sendAmount) * 1000000);
      
      // Create payment transaction - Fix: Use correct parameter structure
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: account.addr,  // Fix: Use 'sender' instead of 'from'
        receiver: sendAddress, // Fix: Use 'receiver' instead of 'to'
        amount: amountInMicroAlgos,
        suggestedParams: suggestedParams,
      });
      
      // Sign the transaction
      const signedTxn = txn.signTxn(account.sk);
      
      // Submit the transaction
      const txResponse = await algodClient.sendRawTransaction(signedTxn).do();
      
      // Wait for confirmation - Fix: Use 'txid' instead of 'txId'
      await algosdk.waitForConfirmation(algodClient, txResponse.txid, 4);
      
      return txResponse.txid;  // Fix: Use 'txid' instead of 'txId'
      
    } catch (error) {
      throw error;
    }
  };

const proceedWithTransaction = async () => {
  if (!verificationResult) return;
  
  setSending(true);
  setSendError('');
  setSendSuccess(false);
  
  try {
    await sendTransaction();
    setSendSuccess(true);
    setSendAddress('');
    setSendAmount('');
    setVerificationResult(null);
    await fetchBalance(walletAddress);
  } catch (error) {
    setSendError(error instanceof Error ? error.message : 'Transaction failed');
  } finally {
    setSending(false);
  }
};
  
  const handleReclaimFunds = async (transferId: string) => {
    if (!transferId) {
      setReclaimError('Transfer ID is required');
      return;
    }
    
    // Get the latest mnemonic from localStorage
    const storedMnemonic = localStorage.getItem('algorand_mnemonic');
    const mnemonicToUse = storedMnemonic || mnemonic;
    
    if (!mnemonicToUse || mnemonicToUse.length === 0) {
      setReclaimError('Wallet mnemonic not available. Please refresh and try again.');
      return;
    }

    
    // Enhanced logging for debugging
    
    // Find transaction details for logging
    const transaction = transactions.find(tx => {
      const safientTx = tx as Transaction;
      return safientTx.transferId === transferId;
    }) as Transaction;
    
    if (transaction) {
    } else {
    }
    
    // Add transfer to reclaiming set
    setReclaimingTransfers(prev => new Set(prev).add(transferId));
    setReclaimError('');
    setReclaimSuccess('');

    try {
      
      const response = await fetch('/Algorand/Algo-smart/api/reclaim-escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transferId,
          senderMnemonic: mnemonicToUse
        })
      });

      const result = await response.json();
      
      
      // Log detailed transaction information
      if (result.data) {
      }
      
      // Enhanced error logging
      if (!result.success) {
        
        // Special handling for overspend errors
        if (result.error && result.error.includes('overspend')) {
          setReclaimError(`Reclaim failed: Insufficient funds in SafientAI protection. ${result.error || 'Unknown error'}`);
        } else {
          setReclaimError(`Reclaim failed: ${result.error || 'Unknown error'}`);
        }
        return;
      }
      
      
      // Log balance changes
      const oldBalance = balance;
      await fetchBalance(walletAddress);
      
      setReclaimSuccess('Funds reclaimed successfully!');
      
      // Update the transaction status in the local state to disable the button
      setTransactions(prevTransactions => 
        prevTransactions.map(tx => {
          const safientTx = tx as Transaction & { transferId?: string; escrowData?: any };
          if (safientTx.transferId === transferId) {
            return {
              ...tx,
              status: 'reclaimed' as const,
              escrowData: {
                ...safientTx.escrowData,
                can_reclaim: false
              }
            } as Transaction;
          }
          return tx;
        })
      );
      
      // Refresh transactions and balance
      await fetchBalance(walletAddress);
      await fetchTransactions(walletAddress);
    } catch (error) {
      setReclaimError(`Network error: ${error instanceof Error ? error.message : 'Please check your connection and try again.'}`);
    } finally {
      // Remove transfer from reclaiming set
      setReclaimingTransfers(prev => {
        const newSet = new Set(prev);
        newSet.delete(transferId);
        return newSet;
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-800 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-violet-500 animate-spin mx-auto" style={{ animationDelay: '0.1s', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 font-medium">Loading wallet...</p>
            <p className="text-gray-500 text-sm">Please wait while we connect to the network</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Enhanced Mobile-Optimized Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800/60 shadow-lg">
        <div className="flex items-center justify-between h-16 sm:h-18 px-4 sm:px-6 lg:px-8">
          <button 
            onClick={() => router.back()}
            className="group flex items-center text-gray-300 hover:text-white transition-all duration-200 min-w-0 flex-shrink-0 p-2 -ml-2 rounded-lg hover:bg-gray-800/50"
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-2 transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline text-sm font-medium">Back</span>
          </button>
          
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
            <div className="relative">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-blue-500 via-violet-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 transform rotate-12 shadow-lg">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white transform -rotate-12" />
              </div>
            </div>
            <div>
              <h1 className="font-mono font-bold text-xl text-white tracking-wider">
                Safient
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Wallet Overview Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-900/30 via-violet-900/20 to-purple-900/30 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-blue-500/20 mb-8 shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-violet-600/5 opacity-50"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-500/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-white/90 rounded-2xl p-2 mr-4 flex-shrink-0 shadow-lg">
                    <img src="/crypto-icon/algo.png" alt="Algorand" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="font-bold text-2xl sm:text-3xl text-white mb-1">Algorand Wallet</h1>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {!isConnected && (
                    <button
                      onClick={connectWallet}
                      disabled={connecting}
                      className="group flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {connecting ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                      ) : (
                        <Link className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                      )}
                      <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-blue-200/70 text-sm font-medium uppercase tracking-wide">Total Balance</p>
                  <p className="font-bold text-3xl sm:text-4xl text-green-400 font-mono">
                    {balance.toFixed(6)} <span className="text-xl text-green-300"></span>
                  </p>
                  <p className="text-gray-400 text-sm">≈ ${(balance * 0.15).toFixed(2)} USD</p>
                </div>
                <div className="space-y-2">
                  <p className="text-blue-200/70 text-sm font-medium uppercase tracking-wide">Wallet Address</p>
                  <div className="flex items-center space-x-3 bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                    <button
                      onClick={() => copyToClipboard(walletAddress)}
                      className="font-mono text-sm text-gray-300 flex-1 truncate hover:text-white transition-colors cursor-pointer text-left"
                    >
                      {formatAddress(walletAddress)}
                    </button>
                    <div className="flex items-center space-x-2">
                      {/* Testnet indicator moved here */}
                      <div className="flex items-center px-3 py-1.5 bg-green-900/30 border border-green-500/40 rounded-full backdrop-blur-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-xs text-green-400 font-medium">Testnet</span>
                      </div>
                      {/* Refresh button moved here */}
                      <button
                        onClick={refreshBalance}
                        disabled={refreshing}
                        className="p-2.5 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all duration-200 disabled:opacity-50 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50"
                      >
                        <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 ${refreshing ? 'animate-spin' : 'hover:rotate-180'}`} />
                      </button>
                      {/* Copy button removed */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Navigation Tabs */}
          <div className="bg-gray-900/60 backdrop-blur-xl p-2 rounded-2xl mb-8 border border-gray-800/50 shadow-lg">
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: Wallet },
                { id: 'send', label: 'Send', icon: Send },
                { id: 'receive', label: 'Receive', icon: Download },
                { id: 'history', label: 'History', icon: History }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`group relative flex flex-col sm:flex-row items-center justify-center px-4 py-4 sm:py-3 rounded-xl transition-all duration-300 font-medium ${
                    activeTab === id
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 sm:mb-0 sm:mr-2 transition-all duration-200 ${
                    activeTab === id ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                  <span className="text-xs sm:text-sm font-semibold">{label}</span>
                  {activeTab === id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-xl blur-xl"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Tab Content */}
          <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-gray-800/60 shadow-2xl">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Wallet className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 className="font-bold text-2xl text-white">Account Overview</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="group bg-gradient-to-br from-green-900/30 to-emerald-900/20 rounded-xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:transform hover:scale-105">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-green-200/70 text-sm font-medium uppercase tracking-wide">Total Balance</p>
                      <div className="p-2 bg-green-600/20 rounded-lg">
                        <Wallet className="h-4 w-4 text-green-400" />
                      </div>
                    </div>
                    <p className="font-bold text-2xl text-green-400 font-mono">{balance.toFixed(6)} ALGO</p>
                    <p className="text-green-300/60 text-sm mt-1">≈ ${(balance * 0.15).toFixed(2)} USD</p>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-blue-900/30 to-violet-900/20 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:transform hover:scale-105">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-blue-200/70 text-sm font-medium uppercase tracking-wide">Transactions</p>
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <History className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <p className="font-bold text-2xl text-blue-400">{transactions.length}</p>
                    <p className="text-blue-300/60 text-sm mt-1">Total transactions</p>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-violet-900/30 to-purple-900/20 rounded-xl p-6 border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300 hover:transform hover:scale-105 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-violet-200/70 text-sm font-medium uppercase tracking-wide">Status</p>
                      <div className={`p-2 rounded-lg ${
                        isConnected ? 'bg-green-600/20' : 'bg-yellow-600/20'
                      }`}>
                        <div className={`h-4 w-4 rounded-full ${
                          isConnected ? 'bg-green-400' : 'bg-yellow-400'
                        } animate-pulse`}></div>
                      </div>
                    </div>
                    <p className={`font-bold text-2xl ${
                      isConnected ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      isConnected ? 'text-green-300/60' : 'text-yellow-300/60'
                    }`}>
                      {isConnected ? 'Wallet is active' : 'Connect your wallet'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'send' && (
              <div className="space-y-8">
                {showAIVerification ? (
                  <SafientAIVerification
                    recipientAddress={sendAddress}
                    amount={parseFloat(sendAmount) || 0}
                    totalAmount={feeData?.totalAmount || 0}
                    onVerificationComplete={handleVerificationComplete}
                    onCancel={handleVerificationCancel}
                  />
                ) : (
                  <>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-red-600/20 rounded-lg">
                        <Send className="h-6 w-6 text-red-400" />
                      </div>
                      <h2 className="font-bold text-2xl text-white">Send ALGO</h2>
                    </div>
                    
                    {sendSuccess && (
                      <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/30 border border-green-500/40 rounded-xl p-6 mb-6 backdrop-blur-sm">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-600/20 rounded-lg mr-4">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                          </div>
                          <div>
                            <p className="text-green-400 font-semibold text-lg">Transaction Successful!</p>
                            <p className="text-green-300/70 text-sm">Your ALGO has been sent successfully</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {sendError && (
                      <div className="bg-gradient-to-r from-red-900/40 to-pink-900/30 border border-red-500/40 rounded-xl p-6 mb-6 backdrop-blur-sm">
                        <div className="flex items-center">
                          <div className="p-2 bg-red-600/20 rounded-lg mr-4">
                            <AlertCircle className="h-6 w-6 text-red-400" />
                          </div>
                          <div>
                            <p className="text-red-400 font-semibold text-lg">Transaction Failed</p>
                            <p className="text-red-300/70 text-sm break-words">{sendError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">Recipient Address</label>
                        <input
                          type="text"
                          value={sendAddress}
                          onChange={(e) => setSendAddress(e.target.value)}
                          placeholder="Enter Algorand address..."
                          className="w-full px-4 py-4 bg-gray-800/60 border border-gray-700/60 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 text-white placeholder-gray-400 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">Amount (ALGO)</label>
                        <input
                          type="number"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          placeholder="0.000000"
                          step="0.000001"
                          min="0"
                          max={balance}
                          className="w-full px-4 py-4 bg-gray-800/60 border border-gray-700/60 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-200 text-white placeholder-gray-400 backdrop-blur-sm font-mono"
                        />
                      </div>
                      
                      {/* Add FeeCalculator component */}
                      <FeeCalculator
                        sendAmount={sendAmount || '0'}
                        balance={balance}
                        onFeeChange={setFeeData}
                        className="mb-6"
                      />
                      
                      {/* Enhanced Send Button with Smart Validation */}
                      <button
                        onClick={handleSafientAI}
                        disabled={Boolean(sending) || !sendAddress || !sendAmount || !feeData?.canEscrow}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
                          sending || !sendAddress || !sendAmount || !feeData?.canEscrow
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                        }`}
                      >
                        <Shield className="h-5 w-5 mr-3 transition-transform group-hover:scale-110" />
                        <span>{sending ? 'Processing...' : 'Send with SafientAI Protection'}</span>
                      </button>
                      {/* SafientAI Protection is the only option now */}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'receive' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <Download className="h-6 w-6 text-green-400" />
                  </div>
                  <h2 className="font-bold text-2xl text-white">Receive ALGO</h2>
                </div>
                
                <div className="text-center space-y-6">
                  <div className="inline-block p-6 bg-white rounded-2xl shadow-2xl">
                    <div className="h-32 w-32 sm:h-40 sm:w-40 bg-white flex items-center justify-center rounded-xl">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${walletAddress}`}
                        alt="Wallet Address QR Code"
                        className="h-32 w-32 sm:h-40 sm:w-40 rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-300 text-lg font-medium">Scan QR code or copy address below</p>
                    <div className="bg-gray-800/60 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm">
                      <p className="font-mono text-sm text-gray-300 break-all mb-4 p-3 bg-gray-900/50 rounded-lg">{walletAddress}</p>
                      <button
                        onClick={() => copyToClipboard(walletAddress)}
                        className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-center">
                          {copied ? (
                            <>
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-violet-600/20 rounded-lg">
                    <History className="h-6 w-6 text-violet-400" />
                  </div>
                  <h2 className="font-bold text-2xl text-white">Transaction History</h2>
                </div>
                
                {/* Add success/error messages */}
                {reclaimSuccess && (
                  <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/30 border border-green-500/40 rounded-xl p-4 mb-4 backdrop-blur-sm">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                      <p className="text-green-400 text-sm">{reclaimSuccess}</p>
                    </div>
                  </div>
                )}
                
                {reclaimError && (
                  <div className="bg-gradient-to-r from-red-900/40 to-pink-900/30 border border-red-500/40 rounded-xl p-4 mb-4 backdrop-blur-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                      <p className="text-red-400 text-sm">{reclaimError}</p>
                    </div>
                  </div>
                )}
                
                {transactions.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="p-4 bg-gray-800/40 rounded-2xl inline-block">
                      <History className="h-12 w-12 text-gray-600 mx-auto" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-400 text-xl font-medium">No transactions yet</p>
                      <p className="text-gray-500 text-sm">Your transaction history will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => {
                      const safientTx = tx as Transaction;
                      const isReclaiming = reclaimingTransfers.has(safientTx.transferId || '');
                      
                      
                      return (
                        <div key={tx.id} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                              <div className={`p-2 rounded-lg flex-shrink-0 ${
                                tx.type === 'send' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'
                              }`}>
                                {tx.type === 'send' ? <Send className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-sm sm:text-base break-words">
                                    {tx.type === 'send' ? 'Sent to' : 'Received from'} {formatAddress(tx.address)}
                                  </p>
                                  {safientTx.safientProtected && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-500/30">
                                      <Shield className="h-3 w-3 mr-1" />
                                      SafientAI Protected
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-400">{formatDate(tx.timestamp)}</p>
                                
                                {/* SafientAI Countdown Timer and Reclaim Button */}
                                {safientTx.safientProtected && safientTx.escrowData && (
                                  <div className="mt-2 p-2 bg-blue-900/10 rounded border border-blue-500/20">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-blue-400">Protection expires:</span>
                                      <div className="text-blue-300">
                                        {safientTx.escrowData.expires_at ? (
                                          <CountdownTimer
                                            expiresAt={safientTx.escrowData.expires_at}
                                            canReclaim={safientTx.escrowData.can_reclaim}
                                            transferId={safientTx.transferId || ''}
                                            status={tx.status}
                                            onReclaim={() => handleReclaimFunds(safientTx.transferId!)}
                                          />
                                        ) : (
                                          <span className="font-mono">Calculating...</span>
                                        )}
                                      </div>
                                    </div>
                                    {safientTx.escrowData.can_reclaim && safientTx.transferId && 
                                     tx.status !== 'reclaimed' && safientTx.safientProtected && (
                                      <button 
                                        className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-1 px-2 rounded text-xs font-medium transition-colors flex items-center justify-center"
                                        onClick={() => handleReclaimFunds(safientTx.transferId!)}
                                        disabled={isReclaiming}
                                      >
                                        {isReclaiming ? (
                                          <>
                                            <div className="animate-spin rounded-full h-3 w-3 border border-white/30 border-t-white mr-2"></div>
                                            Reclaiming...
                                          </>
                                        ) : (
                                          'Reclaim Funds'
                                        )}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-left sm:text-right flex-shrink-0">
                              <p className={`font-medium text-sm sm:text-base ${
                                tx.type === 'send' ? 'text-red-400' : 'text-green-400'
                              }`}>
                                {tx.type === 'send' ? '-' : '+'}{tx.amount.toFixed(6)} ALGO
                              </p>
                              <p className="text-xs sm:text-sm text-gray-400 capitalize">
                                {tx.status === 'escrowed' ? 'SafientAI Protected' : 
                                 tx.status === 'completed' ? (safientTx.autoReleased ? 'Auto-Released' : 'Completed') : 
                                 tx.status === 'reclaimed' ? 'Reclaimed' :
                                 tx.status}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  ); // Close return statement
} // Close AlgorandDashboard component
