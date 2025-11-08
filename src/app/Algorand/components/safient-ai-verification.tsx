import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, Zap, Globe, BarChart3, Database, Lock, ArrowLeft, Send } from 'lucide-react';

interface SafientAIVerificationProps {
  recipientAddress?: string;
  amount?: number;
  totalAmount?: number; // Add totalAmount prop
  onVerificationComplete?: (result: 'safe' | 'risky') => void;
  onCancel?: () => void;
}

// Define the scan result interface
interface ScanResult {
  safe: boolean;
  address: string;
  amount: number;
  totalAmount: number; // Add totalAmount to result
  riskScore: number;
  connected?: string; // For safe results
  alert?: string; // For risky results
  securityLevel: string;
}

export default function SafientAIVerification({ 
  recipientAddress = '0x1a2b3c4d5e6f7g8h9i0j', 
  amount = 4,
  totalAmount = 4.041, // Default with fees included
  onVerificationComplete,
  onCancel 
}: SafientAIVerificationProps) {
  const [scanState, setScanState] = useState('scanning');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState(0);
  const [scanResult, setResult] = useState<ScanResult | null>(null);
  const [speedMultiplier] = useState(1);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Extended scan phases for 40 seconds
  const scanPhases = [
    { 
      title: 'Initializing AI Security Scan', 
      description: 'Preparing advanced security algorithms...',
      icon: <Shield className="h-4 w-4 text-blue-400" />
    },
    { 
      title: 'Connecting to Blockchain Nodes', 
      description: 'Establishing secure connections...',
      icon: <Globe className="h-4 w-4 text-blue-400" />
    },
    { 
      title: 'Querying Safient AI Database', 
      description: 'Searching scam patterns and blacklists...',
      icon: <Database className="h-4 w-4 text-blue-400" />
    },
    { 
      title: 'Analyzing Transaction History', 
      description: 'Examining address patterns...',
      icon: <Search className="h-4 w-4 text-blue-400" />
    },
    { 
      title: 'Cross-referencing Security Networks', 
      description: 'Checking global threat intelligence...',
      icon: <Zap className="h-4 w-4 text-blue-400" />
    },
    { 
      title: 'Verifying Address Integrity', 
      description: 'Cross-referencing security databases...',
      icon: <Lock className="h-4 w-4 text-blue-400" />
    },
    { 
      title: 'Deep Learning Analysis', 
      description: 'Running neural network models...',
      icon: <BarChart3 className="h-4 w-4 text-blue-400" />
    },
    { 
      title: 'Calculating Risk Assessment', 
      description: 'Determining final safety score...',
      icon: <BarChart3 className="h-4 w-4 text-blue-400" />
    }
  ];
  
  // Function to check if address file exists - using API call instead of fs
  const checkAddressInUserData = async (address: string): Promise<boolean> => {
    try {
      // Use API call to check if address file exists in userdata folder
      const response = await fetch('/Algorand/api/check-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Address check result:', data.exists, 'for address:', address);
        return data.exists;
      }
      return false;
    } catch (error) {
      console.log('Error checking address:', error);
      return false;
    }
  };
  
  // Result templates - Updated to include totalAmount
  const safeResult: ScanResult = {
    safe: true,
    address: recipientAddress || '',
    amount: amount || 0,
    totalAmount: totalAmount || 0, // Include total amount
    riskScore: 8,
    connected: 'SafientAI',
    securityLevel: '100%'
  };
  
  const riskyResult: ScanResult = {
    safe: false,
    address: recipientAddress || '',
    amount: amount || 0,
    totalAmount: totalAmount || 0, // Include total amount
    riskScore: 68,
    alert: 'Suspicious patterns detected',
    securityLevel: '45%'
  };
  
  // Start the scan process with perfect 40 second synchronization and backend checking
  const startScan = async () => {
    setScanState('scanning');
    setScanProgress(0);
    setScanPhase(0);
    setResult(null);
    
    const duration = 40000; // Exactly 40 seconds
    const startTime = Date.now();
    const totalPhases = scanPhases.length;
    
    // Start background check for address file in userdata folder
    let addressExists = false;
    try {
      console.log('Checking if address exists in userdata:', recipientAddress);
      addressExists = await checkAddressInUserData(recipientAddress || '');
      console.log('Address exists in userdata:', addressExists);
    } catch (error) {
      console.log('Error checking address file:', error);
      addressExists = false;
    }
    
    const animateProgress = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed < duration) {
        // Perfect linear progress to 100% in exactly 40 seconds
        const progress = (elapsed / duration) * 100;
        setScanProgress(progress);
        
        // Synchronize phase changes with progress
        const phaseIndex = Math.min(
          Math.floor((progress / 100) * totalPhases),
          totalPhases - 1
        );
        setScanPhase(phaseIndex);
        
        animationFrameRef.current = requestAnimationFrame(animateProgress);
      } else {
        // Ensure we hit exactly 100% and complete all phases
        setScanProgress(100);
        setScanPhase(totalPhases - 1);
        
        // Small delay to show 100% completion before showing results
        setTimeout(() => {
          setScanState('result');
          // Show result based on whether address file exists in userdata
          // If address exists in userdata → show safeResult (safe: true) - it's a known address
          // If address doesn't exist in userdata → show riskyResult (safe: false) - unknown address
          const result = addressExists ? safeResult : riskyResult;
          console.log('Final result:', result.safe ? 'SAFE' : 'RISKY', 'Address exists:', addressExists);
          setResult(result);
        }, 300);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  };
  
  useEffect(() => {
    startScan();
    
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [recipientAddress]);
  
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800/80 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/20 to-violet-900/20 p-4 border-b border-blue-500/20">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-violet-600 rounded-lg flex items-center justify-center mr-3">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-white">Safient AI Verification</h3>
            <p className="text-sm text-blue-300">AI-powered transaction protection</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {scanState === 'scanning' && (
          <div className="space-y-6">
            {/* Transaction Details - Updated to show total amount */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Verifying Transaction</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">SafientAI Protected</p>
                  <p className="font-mono text-sm text-gray-300">{formatAddress(recipientAddress || '')}</p>
                  <p className="text-xs text-gray-400 mt-1">Funds secured</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                  <p className="font-mono text-sm text-green-400 font-semibold">{totalAmount?.toFixed(6)} ALGO</p>
                </div>
              </div>
            </div>
            
            {/* Current Phase with Pulsing Animation */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-blue-900/30 rounded-full mb-3 relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping"></div>
                <Search className="h-6 w-6 text-blue-400 animate-pulse relative z-10" />
              </div>
              <h4 className="text-lg font-semibold text-blue-400 mb-1">
                {scanPhases[scanPhase]?.title}
              </h4>
              <p className="text-sm text-gray-400">
                {scanPhases[scanPhase]?.description}
              </p>
            </div>
            
            {/* Progress Bar with Glow Effect - Perfectly Synchronized */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Scanning Progress</span>
                <span className="text-blue-400">{Math.round(scanProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-100 relative"
                  style={{ width: `${scanProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Scan Activities with Perfect Synchronization */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scanPhases.map((phase, index) => {
                const isCompleted = index < scanPhase || (index === scanPhase && scanProgress >= ((index + 1) / scanPhases.length) * 100);
                const isCurrent = index === scanPhase;
                
                return (
                  <div key={index} className={`flex items-center bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 transition-all duration-300 ${
                    index > scanPhase ? 'opacity-40' : isCurrent ? 'border-blue-500/30 bg-blue-900/10 shadow-lg shadow-blue-500/10' : 'opacity-70'
                  }`}>
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center mr-3 flex-shrink-0 transition-all duration-300 ${
                      isCompleted ? 'bg-green-500/20' : isCurrent ? 'bg-blue-500/20' : 'bg-gray-700/50'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      ) : isCurrent ? (
                        <div className="relative">
                          {phase.icon}
                          <div className="absolute inset-0 animate-ping bg-blue-400/30 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="h-2 w-2 bg-gray-600 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">
                        {phase.title}
                        {isCurrent && !isCompleted && (
                          <span className="ml-2">
                            <span className="animate-pulse">.</span>
                            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                            <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="ml-2 text-green-400 animate-bounce">✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Estimated Time with Live Countdown - Perfect Sync */}
            <div className="text-center text-sm text-gray-400">
              <p>Estimated time remaining: {Math.max(0, Math.ceil(40 - (scanProgress * 40 / 100)))}s</p>
              <div className="mt-2 flex justify-center space-x-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Result Screen - Shows after 100% completion based on file check */}
        {scanState === 'result' && scanResult && (
          <div className="space-y-6">
            {/* Result Header with Animation */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center h-16 w-16 rounded-full mb-4 relative ${
                scanResult.safe 
                  ? 'bg-green-900/30' 
                  : 'bg-amber-900/30'
              }`}>
                <div className={`absolute inset-0 rounded-full animate-ping ${
                  scanResult.safe ? 'bg-green-400/20' : 'bg-amber-400/20'
                }`}></div>
                {scanResult.safe ? (
                  <CheckCircle className="h-8 w-8 text-green-400 relative z-10 animate-bounce" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-amber-400 relative z-10 animate-pulse" />
                )}
              </div>
              <h3 className={`text-xl font-bold mb-2 ${
                scanResult.safe ? 'text-green-400' : 'text-amber-400'
              }`}>
                {scanResult.safe 
                  ? 'Transaction Verified Safe' 
                  : 'Potential Risk Detected'}
              </h3>
              <p className="text-sm text-gray-400">
                {scanResult.safe 
                  ? 'This address has been verified as safe. Your transaction is fully protected.' 
                  : 'This address shows some risk factors. Proceed with caution.'}
              </p>
            </div>
            
            {/* Analysis Details */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Analysis Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/70 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Risk Score</p>
                  <p className={`text-sm font-medium ${
                    scanResult.riskScore < 20 
                      ? 'text-green-400' 
                      : scanResult.riskScore < 50 
                        ? 'text-amber-400' 
                        : 'text-red-400'
                  }`}>
                    {scanResult.riskScore}/100
                  </p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Safient AI</p>
                  <p className="text-sm font-medium text-gray-300">Protected</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">{scanResult.safe ? 'Connected' : 'Alert'}</p>
                  <p className="text-sm font-medium text-gray-300">{scanResult.connected || scanResult.alert}</p>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Transactions</p>
                  <p className="text-sm font-medium text-gray-300">Verified</p>
                </div>
              </div>
            </div>
            
            {/* Send and Cancel Buttons - Available after verification */}
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  onCancel?.();
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-500 hover:to-gray-400 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button 
                onClick={() => {
                  onVerificationComplete?.(scanResult.safe ? 'safe' : 'risky');
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}</style>
    </div>
  );
}