'use client';

import { useState, useEffect, useRef } from 'react';
import { Shield, Wallet, ArrowRight, ChevronDown, Zap, Clock, Fingerprint, AlertTriangle, Search, CheckCircle, XCircle, AlertCircle, ExternalLink, Globe, ChevronUp, Brain, Lock, Target, Activity, TrendingUp, RefreshCw, Award, FileText } from 'lucide-react';
import { FaMicrochip } from 'react-icons/fa';
import Footer from './footer/page';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Define types for crypto objects
interface CryptoItem {
  id: string;
  name: string;
  color: string;
  balance: string;
}

interface ExpandedCryptoItem {
  id: string;
  name: string;
  symbol: string;
  color: string;
  balance: string;
}

// Define scan result interface
interface ScanResult {
  status: 'safe' | 'warning' | 'danger' | 'error';
  title: string;
  message: string;
  riskScore?: number;
  details?: {
    transactions: number;
    age: string;
    connections: string;
  };
  address?: string;
  fullAddress?: string;
  timestamp?: string;
}

export default function SafientWalletUI() {
  const router = useRouter();
  const [aiProcessing, setAiProcessing] = useState<number>(30 * 60); // Changed from countdown
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('eth');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('losses');
  
  // Address scanner states
  const [address, setAddress] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  
  // FAQ accordion state
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  
  // Crypto carousel states
  const [carouselPosition, setCarouselPosition] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [scrollSpeed, setScrollSpeed] = useState<number>(2);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
  const [scrollDirection, setScrollDirection] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [velocity, setVelocity] = useState<number>(0);
  const [lastMoveTime, setLastMoveTime] = useState<number>(0);
  const [selectedCryptoItem, setSelectedCryptoItem] = useState<ExpandedCryptoItem | null>(null);
  
  // Create the array of cryptocurrencies
  const cryptos: CryptoItem[] = [
    { id: '1inch', name: '1INCH', color: 'text-purple-400', balance: '45.67' },
    { id: 'ada', name: 'ADA', color: 'text-teal-400', balance: '342.16' },
    { id: 'algo', name: 'ALGO', color: 'text-gray-400', balance: '89.23' },
    { id: 'atom', name: 'ATOM', color: 'text-purple-400', balance: '45.67' },
    { id: 'avax', name: 'AVAX', color: 'text-red-400', balance: '28.03' },
    { id: 'bnb', name: 'BNB', color: 'text-yellow-400', balance: '15.87' },
    { id: 'comp', name: 'COMP', color: 'text-green-400', balance: '12.45' },
    { id: 'eth', name: 'ETH', color: 'text-blue-400', balance: '2.34' },
    { id: 'ksm', name: 'KSM', color: 'text-pink-400', balance: '8.91' },
    { id: 'ltc', name: 'LTC', color: 'text-gray-400', balance: '12.89' },
    { id: 'mana', name: 'MANA', color: 'text-green-400', balance: '234.56' },
    { id: 'sand', name: 'SAND', color: 'text-yellow-400', balance: '156.78' },
    { id: 'shib', name: 'SHIB', color: 'text-orange-400', balance: '1,234,567' },
    { id: 'sol', name: 'SOL', color: 'text-indigo-400', balance: '128.45' },
    { id: 'theta', name: 'THETA', color: 'text-blue-400', balance: '67.89' },
    { id: 'trx', name: 'TRX', color: 'text-red-400', balance: '2,345.67' }
  ].sort((a, b) => a.id.localeCompare(b.id)); // Sort alphabetically by id
  
  const getCryptoBalance = (id: string): string => {
    const crypto = cryptos.find(c => c.id === id);
    return crypto ? crypto.balance : '0.00';
  };

  const getCryptoColor = (id: string): string => {
    const crypto = cryptos.find(c => c.id === id);
    return crypto ? crypto.color : 'text-gray-400';
  };

  // Add expanded cryptocurrencies for the carousel
  const expandedCryptos: ExpandedCryptoItem[] = [
    { id: '1inch', name: '1inch Protocol', symbol: '1INCH', color: 'text-purple-400', balance: '45.67' },
    { id: 'ada', name: 'Cardano', symbol: 'ADA', color: 'text-teal-400', balance: '342.16' },
    { id: 'algo', name: 'Algorand', symbol: 'ALGO', color: 'text-gray-400', balance: '89.23' },
    { id: 'atom', name: 'Cosmos', symbol: 'ATOM', color: 'text-purple-400', balance: '45.67' },
    { id: 'avax', name: 'Avalanche', symbol: 'AVAX', color: 'text-red-400', balance: '28.03' },
    { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', color: 'text-yellow-400', balance: '15.87' },
    { id: 'comp', name: 'Compound', symbol: 'COMP', color: 'text-green-400', balance: '12.45' },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', color: 'text-blue-400', balance: '2.34' },
    { id: 'ksm', name: 'Kusama', symbol: 'KSM', color: 'text-pink-400', balance: '8.91' },
    { id: 'ltc', name: 'Litecoin', symbol: 'LTC', color: 'text-gray-400', balance: '12.89' },
    { id: 'mana', name: 'Decentraland', symbol: 'MANA', color: 'text-green-400', balance: '234.56' },
    { id: 'sand', name: 'The Sandbox', symbol: 'SAND', color: 'text-yellow-400', balance: '156.78' },
    { id: 'shib', name: 'Shiba Inu', symbol: 'SHIB', color: 'text-orange-400', balance: '1,234,567' },
    { id: 'sol', name: 'Solana', symbol: 'SOL', color: 'text-indigo-400', balance: '128.45' },
    { id: 'theta', name: 'Theta Network', symbol: 'THETA', color: 'text-blue-400', balance: '67.89' },
    { id: 'trx', name: 'TRON', symbol: 'TRX', color: 'text-red-400', balance: '2,345.67' }
  ].sort((a, b) => a.id.localeCompare(b.id)); // Sort alphabetically by id
  
  // Add CSS class for hiding scrollbars
  useEffect(() => {
    // Add this CSS to the document
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .scanning-effect {
        position: relative;
      }
      .scanning-effect::before {
        content: '';
        position: absolute;
        top: 0;
        left: -200px;
        width: 200px;
        height: 100%;
        background: linear-gradient(to right, transparent, rgba(59, 130, 246, 0.1), transparent);
        animation: scan 2s infinite linear;
      }
      @keyframes scan {
        0% {
          left: -200px;
        }
        100% {
          left: 100%;
        }
      }
      .animate-pulse-slow {
        animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
    if (!isAnimating) {
      setAiProcessing(30 * 60); // Changed from setCountdown
    }
  };
  
  const formatAITime = (seconds: number): string => { // Changed from formatTime
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCryptoSelect = (id: string): void => {
    setSelectedCrypto(id);
    setDropdownOpen(false);
  };

  // SafientAI Processing AI intelligence (changed from Timer animation)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAnimating) {
      interval = setInterval(() => {
        setAiProcessing(prev => { // Changed from setCountdown
          if (prev <= 1) {
            if (interval !== null) clearInterval(interval);
            setIsAnimating(false);
            return 30 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval !== null) clearInterval(interval);
    };
  }, [isAnimating]);
  
  // Detect mobile device
  useEffect(() => {
    const checkMobile = (): void => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced effect for carousel auto scrolling with faster mobile speed
  useEffect(() => {
    let animationFrame: number | null = null;
    const baseSpeed = isMobile ? 1.5 : 0.8;
    const scrollAmount = baseSpeed * scrollSpeed * scrollDirection;
    
    const updatePosition = (): void => {
      if (autoScrollEnabled && !isDragging) {
        setCarouselPosition(prevPos => {
          const itemWidth = isMobile ? 130 : 180;
          const totalWidth = expandedCryptos.length * itemWidth;
          let newPos = prevPos + scrollAmount;
          
          if (newPos > totalWidth) {
            newPos = 0;
          } else if (newPos < 0) {
            newPos = totalWidth;
          }
          
          return newPos;
        });
      }
      animationFrame = requestAnimationFrame(updatePosition);
    };
    
    animationFrame = requestAnimationFrame(updatePosition);
    
    return () => {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    };
  }, [autoScrollEnabled, isDragging, scrollSpeed, scrollDirection, expandedCryptos.length, isMobile]);
  
  // Enhanced touch/mouse handlers with velocity tracking
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent): void => {
    setIsDragging(true);
    setAutoScrollEnabled(false);
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    setStartX(clientX);
    setStartTime(Date.now());
    setVelocity(0);
    setLastMoveTime(Date.now());
  };
  
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent): void => {
    if (!isDragging) return;
    
    e.preventDefault(); // Prevent scrolling on mobile
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    if (!clientX) return;
    
    const currentTime = Date.now();
    const deltaX = startX - clientX;
    const deltaTime = currentTime - lastMoveTime;
    
    // Calculate velocity for momentum
    if (deltaTime > 0) {
      setVelocity(Math.abs(deltaX) / deltaTime);
    }
    
    setStartX(clientX);
    setLastMoveTime(currentTime);
    
    setCarouselPosition(prevPos => {
      // Enhanced speed calculation based on touch velocity
      const speedMultiplier = isMobile ? Math.min(velocity * 2, 8) : Math.min(velocity, 4);
      const dragSpeed = Math.max(speedMultiplier, 1);
      setScrollSpeed(dragSpeed);
      
      // Set direction based on drag
      if (deltaX > 0) {
        setScrollDirection(1); // Moving left (forward)
      } else if (deltaX < 0) {
        setScrollDirection(-1); // Moving right (backward)
      }
      
      // Enhanced drag responsiveness
      const dragMultiplier = isMobile ? 0.8 : 0.5;
      return prevPos + deltaX * dragMultiplier;
    });
  };
  
  const handleDragEnd = (): void => {
    setIsDragging(false);
    
    // Momentum scrolling based on final velocity
    const momentumDuration = Math.min(velocity * 1000, 3000);
    
    setTimeout(() => {
      setAutoScrollEnabled(true);
      // Reset to faster mobile speed after interaction
      setScrollSpeed(isMobile ? 2.5 : 1.5);
    }, momentumDuration);
    
    // Gradually reduce speed back to normal
    setTimeout(() => {
      setScrollSpeed(isMobile ? 2 : 1);
    }, momentumDuration + 1000);
  };
  
  // Handle crypto item click
  const handleCryptoClick = (crypto: ExpandedCryptoItem): void => {
    setSelectedCryptoItem(crypto);
    setSelectedCrypto(crypto.id);
    
    // Optional: Add haptic feedback on mobile
    if (isMobile && navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Optional: Show selection feedback
    console.log('Selected crypto:', crypto);
  };
  
  const CryptoCarousel = () => {
    return (
      <div 
        className="relative overflow-hidden select-none"
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'pan-y pinch-zoom' // Allow vertical scroll but handle horizontal
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseMove={handleDragMove}
        onTouchMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onTouchEnd={handleDragEnd}
        onMouseLeave={handleDragEnd}
      >
        <div 
          className="flex transition-transform ease-out" 
          style={{ 
            transform: `translateX(-${carouselPosition}px)`,
            willChange: 'transform',
            transitionDuration: isDragging ? '0ms' : '100ms'
          }}
        >
          {[...expandedCryptos, ...expandedCryptos, ...expandedCryptos].map((crypto, index) => (
            <div 
              key={`crypto-${index}`} 
              className={`flex flex-col items-center px-3 sm:px-6 group min-w-[130px] sm:min-w-[180px] cursor-pointer transition-all duration-300 ${
                selectedCryptoItem?.id === crypto.id ? 'scale-105' : 'hover:scale-110'
              }`}
              onClick={() => handleCryptoClick(crypto)}
            >
              <div className="relative mb-3 sm:mb-4 transition-all duration-500 transform group-hover:scale-110">
                <div className={`absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-blue-600/20 to-violet-600/20 rounded-full blur-lg transition-opacity duration-500 ${
                  selectedCryptoItem?.id === crypto.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}></div>
                <div className={`h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24 bg-white rounded-full flex items-center justify-center relative shadow-lg transition-all duration-300 ${
                  selectedCryptoItem?.id === crypto.id ? 'ring-2 ring-blue-400 shadow-blue-400/50' : ''
                }`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/50 rounded-full"></div>
                  <img 
                    src={`/crypto-icon/${crypto.id}.png`}
                    alt={crypto.name}
                    className="h-8 w-8 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain relative z-10 transition-transform duration-300 group-hover:scale-110"
                    onError={handleImgError}
                    draggable={false}
                  />
                </div>
              </div>
              <div className="text-center">
                <h3 className={`text-sm sm:text-base md:text-xl font-heading font-bold ${crypto.color} transition-colors duration-300`}>
                  {crypto.symbol}
                </h3>
                <p className="font-body text-xs text-gray-400 hidden sm:block">{crypto.name}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Enhanced drag indicator with velocity feedback */}
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute inset-0 bg-gradient-to-r transition-opacity duration-200 ${
              scrollDirection === 1 
                ? 'from-blue-500/20 via-transparent to-transparent' 
                : 'from-transparent via-transparent to-blue-500/20'
            }`}></div>
            {/* Velocity indicator */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Speed: {Math.round(velocity * 10) / 10}x
            </div>
          </div>
        )}
        
        {/* Mobile-specific speed indicator */}
        {isMobile && autoScrollEnabled && (
          <div className="absolute bottom-2 left-2 bg-black/30 text-white text-xs px-2 py-1 rounded">
            Auto: {scrollSpeed.toFixed(1)}x
          </div>
        )}
      </div>
    );
  };

  // Handle image loading errors
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/crypto-icon/eth.png';
  };

  // Address scanner functions
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setAddress(e.target.value);
    setScanResult(null);
  };

  // Make sure we're consistent with function naming
  const handleScan = (): void => {
    if (!address || address.length < 10) {
      setScanResult({
        status: 'error',
        title: 'Invalid Address Format',
        message: 'Please enter a valid blockchain address to scan.'
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const results: ScanResult[] = [
        {
          status: 'safe',
          title: 'Address Verified Safe',
          message: 'Our AI has analyzed this address and found no suspicious activity or connections to known scams.',
          riskScore: Math.floor(Math.random() * 15) + 1,
          details: {
            transactions: Math.floor(Math.random() * 500) + 50,
            age: Math.floor(Math.random() * 24) + 1 + ' months',
            connections: 'No connections to known scammers'
          }
        },
        {
          status: 'warning',
          title: 'Potential Risk Detected',
          message: 'Our AI has detected some unusual patterns with this address that suggest potential risk.',
          riskScore: Math.floor(Math.random() * 30) + 30,
          details: {
            transactions: Math.floor(Math.random() * 100) + 20,
            age: Math.floor(Math.random() * 6) + 1 + ' months',
            connections: 'Indirect connections to suspicious addresses'
          }
        },
        {
          status: 'danger',
          title: 'High Risk Address Detected',
          message: 'This address has been flagged as potentially dangerous. We recommend against interacting with it.',
          riskScore: Math.floor(Math.random() * 30) + 70,
          details: {
            transactions: Math.floor(Math.random() * 50) + 5,
            age: Math.floor(Math.random() * 3) + 1 + ' days',
            connections: 'Direct connections to known scam addresses'
          }
        }
      ];

      let resultIndex: number;
      if (address.toLowerCase().includes('safe') || address.startsWith('0x1')) {
        resultIndex = 0;
      } else if (address.toLowerCase().includes('risk') || address.startsWith('0x2')) {
        resultIndex = 1;
      } else if (address.toLowerCase().includes('scam') || address.startsWith('0x3')) {
        resultIndex = 2;
      } else {
        resultIndex = Math.floor(Math.random() * results.length);
      }

      const result = { ...results[resultIndex] };
      
      const truncatedAddress = address.length > 12 
        ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
        : address;
      
      result.address = truncatedAddress;
      result.fullAddress = address;
      result.timestamp = new Date().toLocaleString();
      
      setScanResult(result);
      setScanHistory(prev => [result, ...prev].slice(0, 5));
      setIsScanning(false);
    }, 2500);
  };

  const getStatusColor = (status: ScanResult['status']): string => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: ScanResult['status']): JSX.Element => {
    switch (status) {
      case 'safe': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-400" />;
      case 'danger': return <XCircle className="h-5 w-5 text-red-400" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRiskColor = (score: number): string => {
    if (score < 20) return 'text-green-400';
    if (score < 50) return 'text-amber-400';
    return 'text-red-400';
  };

  // Add navigation function
const handleCreateWallet = () => {
  router.push('/wallet');
};

// Add import wallet navigation function
const handleImportWallet = () => {
  router.push('/Import');
};

  // The component render
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/90 backdrop-blur-lg border-b border-gray-800/50 flex items-center justify-center h-16 px-4">
        <div className="flex items-center">
          <div className="h-9 w-9 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg flex items-center justify-center mr-2 transform rotate-12">
            <Wallet className="h-5 w-5 text-white transform -rotate-12" />
          </div>
          <span className="font-mono font-bold text-xl text-white tracking-wider">Safient</span>
        </div>
      </header>
      
      <div className="pt-16">
        {/* Hero Section */}
        <section 
          className="min-h-[calc(100vh-4rem)] flex items-center py-12 px-4"
        >
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-2/3 h-1/2 bg-violet-500/5 blur-[120px] rounded-full"></div>
          </div>
          
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
              {/* Hero Text */}
              <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-500/30 mb-4">
                  <span className="text-sm font-medium text-blue-400">AI-Powered Security</span>
                </div>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight mb-4 md:mb-6">
                  <span className="block">AI-Secured Wallet with</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400">
                    Funds Recovery Guarantee
                  </span>
                </h1>
                
                <p className="text-lg font-body text-gray-300 mb-6 leading-relaxed max-w-xl">
                  Our <span className="font-heading font-semibold text-blue-400">AI-powered SecureVault™</span> monitors transactions, blocks suspicious transfers, and gives you SafientAI Model protection to recover your funds from any unauthorized activity.
                </p>
                
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-3 border border-gray-800/80">
                    <p className="font-heading font-bold text-xl text-red-400">$4.3B</p>
                    <p className="font-body text-xs text-gray-400">Lost to hacks in 2024</p>
                  </div>
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-3 border border-gray-800/80">
                    <p className="font-heading font-bold text-xl text-red-400">94%</p>
                    <p className="font-body text-xs text-gray-400">Funds never recovered</p>
                  </div>
                  <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-3 border border-gray-800/80">
                    <p className="font-heading font-bold text-xl text-green-400">85%</p>
                    <p className="font-body text-xs text-gray-400">Recovery with Safient AI</p>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <button 
                    onClick={handleCreateWallet}
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-heading font-medium rounded-xl shadow-lg flex items-center justify-center"
                  >
                    Create Wallet <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                  <button
                    onClick={handleImportWallet}
                    className="px-5 py-3 bg-gray-900 text-gray-200 font-heading font-medium rounded-xl border border-gray-800 transition-all duration-300 flex items-center justify-center"
                  >
                    Import Wallet
                  </button>
                </div>
              </div>
              
              {/* Wallet Preview */}
              <div className="md:w-1/2 w-full relative max-w-md mx-auto md:max-w-none">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-transparent rounded-[28px] blur-lg opacity-50 animate-pulse-slow"></div>
                <div className="bg-gray-900/90 backdrop-blur-md rounded-[24px] border border-gray-800/80 p-5 sm:p-6 shadow-2xl relative overflow-hidden transition-all duration-500 transform hover:translate-y-[-5px] hover:scale-[1.02]">
                  {/* Exclusive badge */}
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full py-1 px-4 shadow-lg transform rotate-12">
                    <span className="text-xs font-bold text-white">AI SECURED</span>
                  </div>
                
                {/* Wallet Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center mr-3">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-mono font-bold text-xl text-white letter-spacing-wider">Safient</span>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-gray-400">Balance</p>
                    <p className="text-xl font-heading font-bold text-white">{getCryptoBalance(selectedCrypto)} {cryptos.find(c => c.id === selectedCrypto)?.name}</p>
                  </div>
                </div>
                
                {/* Wallet Info Sections */}
                <div className="space-y-4">
                  {/* Wallet ID Section */}
                  <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-blue-900/50 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-body text-sm text-gray-500">Wallet ID</p>
                        <p className="font-mono text-sm text-gray-300">8Kw5...7Yh3</p>
                      </div>
                      <div className="h-9 w-9 bg-gray-700/50 rounded-full flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Fingerprint className="h-5 w-5 text-blue-400" strokeWidth={1.25} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Crypto Dropdown Section */}
                  <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-blue-900/50 transition-all duration-300 relative z-10">
                    <div 
                      className="flex items-center justify-between w-full cursor-pointer"
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      <div className="flex items-center">
                        <div className="h-9 w-9 bg-white rounded-full flex items-center justify-center mr-3 shadow-md shadow-blue-500/10 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/50"></div>
                          <img 
                            src={`/crypto-icon/${selectedCrypto}.png`}
                            alt={cryptos.find(c => c.id === selectedCrypto)?.name}
                            className="h-6 w-6 relative z-10 object-contain"
                            onError={handleImgError}
                          />
                        </div>
                        <div>
                          <p className={`${getCryptoColor(selectedCrypto)} font-heading text-sm font-medium`}>
                            {cryptos.find(c => c.id === selectedCrypto)?.name}
                          </p>
                          <p className="font-body text-xs text-gray-500">07/28/2025 01:16 AM</p>
                        </div>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${dropdownOpen ? 'transform rotate-180' : ''}`} />
                    </div>
                    
                    {/* Dropdown Menu - NO TRANSPARENCY */}
                    {dropdownOpen && (
                      <div className="absolute z-[9999] mt-2 w-full left-0 bg-gray-800 rounded-xl shadow-2xl max-h-40 overflow-y-auto border-2 border-gray-600 ring-2 ring-blue-500/20">
                        {cryptos.map(crypto => (
                          <div 
                            key={crypto.id}
                            className="flex items-center p-4 hover:bg-gray-700 cursor-pointer transition-all duration-200 first:rounded-t-xl last:rounded-b-xl border-b border-gray-700 last:border-b-0"
                            onClick={() => handleCryptoSelect(crypto.id)}
                          >
                            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center mr-3 shadow-lg relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100"></div>
                              <img 
                                src={`/crypto-icon/${crypto.id}.png`}
                                alt={crypto.name}
                                className="h-5 w-5 relative z-10 object-contain"
                                onError={handleImgError}
                              />
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm ${crypto.color} font-heading font-semibold block`}>{crypto.name}</span>
                              <span className="font-body text-xs text-gray-400">{crypto.balance} {crypto.name}</span>
                            </div>
                            {selectedCrypto === crypto.id && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* AI Security Section */}
                  <div className="bg-gradient-to-r from-blue-900/30 to-violet-900/30 backdrop-blur-sm rounded-xl p-4 border border-blue-800/30 hover:border-blue-700/50 transition-all duration-300 relative overflow-hidden">
                    {/* Security Ribbon */}
                    <div className="absolute -right-12 top-2 transform rotate-45 bg-gradient-to-r from-blue-500 to-violet-500 text-xs py-1 px-12 text-white font-bold shadow-md">
                      AI RECOVERY
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-heading text-sm text-blue-300 font-medium">AI SecureVault™ Active</p>
                        <p className="font-body text-xs text-gray-400">Funds recovery guaranteed</p>
                      </div>
                      <div className="h-9 w-9 bg-blue-800/30 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-blue-300" />
                      </div>
                    </div>
                    
                    {/* SafientAI Security Analysis */}
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <p className="font-body text-xs text-blue-300">SafientAI Analysis</p>
                        <p className="font-mono text-xs text-blue-300 font-medium">{formatAITime(aiProcessing)}</p>
                      </div>
                      <div className="h-2 w-full bg-blue-900/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-1000"
                          style={{ width: `${100 - (aiProcessing / (30 * 60) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition-colors duration-300 flex items-center justify-center text-sm font-heading font-medium">
                      <Zap className="h-4 w-4 mr-2" /> Send
                    </button>
                    <button onClick={toggleAnimation} className="bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl transition-colors duration-300 flex items-center justify-center text-sm font-heading font-medium">
                      <Clock className="h-4 w-4 mr-2" /> {isAnimating ? "Stop AI" : "Start AI"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* AI Transaction Analysis Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-gray-950 to-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Left Content */}
              <div className="lg:w-1/2">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-500/30 mb-6">
                  <Brain className="h-3.5 w-3.5 text-blue-400 mr-2" />
                  <span className="text-sm font-medium text-blue-400">AI TRANSACTION ANALYSIS</span>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
                  AI Transaction Analysis
                </h2>
                
                <p className="text-lg text-gray-300 font-body leading-relaxed mb-8">
                  When sending crypto, our AI scans for suspicious patterns, checks blacklisted addresses, and authenticates the transaction as legitimate.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center text-blue-400 mb-2">
                      <Target className="h-5 w-5 mr-2" />
                      <span className="font-heading font-semibold">Pattern Recognition</span>
                    </div>
                    <p className="text-sm text-gray-400 font-body">Advanced ML algorithms detect anomalous transaction behaviors</p>
                  </div>
                  
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                    <div className="flex items-center text-blue-400 mb-2">
                      <Lock className="h-5 w-5 mr-2" />
                      <span className="font-heading font-semibold">Real-time Validation</span>
                    </div>
                    <p className="text-sm text-gray-400 font-body">Instant verification against global threat databases</p>
                  </div>
                </div>
              </div>

              {/* Right - AI Analysis Card */}
              <div className="lg:w-1/2 w-full max-w-md mx-auto lg:max-w-none">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700/50 shadow-2xl relative overflow-hidden">
                  {/* Animated background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-violet-600/10 to-blue-600/5 animate-pulse-slow"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center mb-6">
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-heading font-bold text-white">Threat Detection</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700/30">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400 font-body">Address Risk:</span>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm text-green-400 font-heading font-semibold">Low</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400 font-body">AI Score:</span>
                          <div className="flex items-center">
                            <span className="text-lg font-heading font-bold text-green-400 mr-2">98/100</span>
                            <div className="w-4 h-4 border-2 border-green-400 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            </div>
                            <span className="text-xs text-green-400 font-body ml-2">Safe</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-700/30">
                        <div className="flex items-center text-blue-300 mb-2">
                          <Activity className="h-4 w-4 mr-2" />
                          <span className="text-sm font-heading font-semibold">Analysis Complete</span>
                        </div>
                        <p className="text-xs text-blue-200 font-body">Transaction verified against 50M+ threat indicators</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI That Actually Recovers Your Funds Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-900/30 to-violet-900/30 border border-blue-700/50 mb-6">
                <RefreshCw className="h-4 w-4 text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-400">REVOLUTIONARY TECHNOLOGY</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-6">
                AI That Actually <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400">Recovers Your Funds</span>
              </h2>
              
              <p className="text-xl text-gray-300 font-body max-w-4xl mx-auto leading-relaxed">
                Unlike traditional wallets that can't help after a hack, our proprietary AI analyzes billions of data points to detect threats, block unauthorized transfers, and reclaim your assets.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* AI Threat Detection */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 hover:border-blue-700/50 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-heading font-bold text-white mb-4">AI Threat Detection</h3>
                  <p className="text-gray-300 font-body mb-6 leading-relaxed">
                    Our neural networks analyze 200+ risk factors in milliseconds, identifying suspicious patterns before funds leave your wallet.
                  </p>
                  
                  <div className="space-y-3">
                    {[
                      'Blacklist Database Integration',
                      'Malicious Address Detection', 
                      'Behavior-Based Anomaly Alerts'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-body text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Fund Recovery */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 hover:border-violet-700/50 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="h-16 w-16 bg-gradient-to-br from-violet-600 to-violet-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <RefreshCw className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-heading font-bold text-white mb-4">AI Fund Recovery</h3>
                  <p className="text-gray-300 font-body mb-6 leading-relaxed">
                    <span className="font-semibold text-violet-400">Unique to Safient:</span> Our AI can automatically recover your funds from suspicious transactions within the SafientAI security window.
                  </p>
                  
                  <div className="space-y-3">
                    {[
                      'Automated Transaction Reversal',
                      'Smart Contract Safient System',
                      '85% Recovery Success Rate'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-body text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Adaptive Defense */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700/50 hover:border-indigo-700/50 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="h-16 w-16 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-heading font-bold text-white mb-4">Adaptive Defense</h3>
                  <p className="text-gray-300 font-body mb-6 leading-relaxed">
                    Our AI evolves with each attack, continuously learning from global threat data to protect against emerging exploit techniques.
                  </p>
                  
                  <div className="space-y-3">
                    {[
                      'Real-Time Attack Pattern Learning',
                      'Cross-Chain Vulnerability Detection',
                      'Zero-Day Exploit Prevention'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-body text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl text-white font-heading font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <Shield className="h-5 w-5 mr-2" />
                Experience AI-Powered Recovery
              </div>
            </div>
          </div>
        </section>
        
        {/* AI Address Scanner Section */}
        <section 
          className="py-16 px-4"
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-xl border border-gray-800 overflow-hidden p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-8">
                  <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-500/30 mb-4">
                    <Search className="h-3.5 w-3.5 text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-blue-400">NEW FEATURE</span>
                  </div>
                  
                  <h2 className="font-heading text-2xl md:text-3xl font-semibold mb-4 text-white">
                    AI Address <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-indigo-400">Scanner</span>
                  </h2>
                  
                  <p className="font-body text-gray-300 mb-6 leading-relaxed">
                    Our advanced AI technology scans any blockchain address to detect potential risks before you send your assets. Protect yourself from scams, blacklisted addresses, and suspicious activity.
                  </p>
                  
                  <div className="flex items-center mb-6">
                    <div className="flex-1 h-0.5 bg-gray-800"></div>
                    <p className="px-3 font-body text-sm text-gray-500">AI-POWERED PROTECTION</p>
                    <div className="flex-1 h-0.5 bg-gray-800"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex items-center text-blue-400 mb-2">
                        <Shield className="h-4 w-4 mr-2" />
                        <span className="font-heading text-sm font-medium">Risk Detection</span>
                      </div>
                      <p className="font-body text-xs text-gray-400">Identifies addresses with suspicious patterns and known scam connections</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex items-center text-blue-400 mb-2">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="font-heading text-sm font-medium">Scam Database</span>
                      </div>
                      <p className="font-body text-xs text-gray-400">Cross-references addresses with our extensive database of known scammers</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
                      <div className="flex items-center text-blue-400 mb-2">
                        <Zap className="h-4 w-4 mr-2" />
                        <span className="font-heading text-sm font-medium">Real-time Analysis</span>
                      </div>
                      <p className="font-body text-xs text-gray-400">Continuously updated with the latest blockchain security intelligence</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-800/80 p-5 shadow-lg relative overflow-hidden">
                    <h3 className="font-heading text-lg font-medium text-white mb-4">Scan Any Address</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block font-body text-sm text-gray-400 mb-1.5">Blockchain Address</label>
                        <div className="relative">
                          <input 
                            type="text"
                            value={address}
                            onChange={handleAddressChange}
                            placeholder="Enter wallet address to scan..."
                            className="w-full bg-gray-800/70 text-white border border-gray-700 rounded-lg py-3 px-4 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-body"
                          />
                          
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <button 
                              onClick={handleScan}
                              disabled={isScanning || !address}
                              className="text-gray-400 hover:text-blue-400 disabled:text-gray-600 p-2"
                            >
                              <Search className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center space-x-2 space-y-2 sm:space-y-0 font-body text-sm text-gray-400">
                        <span>Try examples:</span>
                        <button 
                          onClick={() => setAddress('0x1a2b3c4d5e6f7g8h9i0j')}
                          className="text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 bg-gray-800/50 rounded-md"
                        >
                          Safe Address
                        </button>
                        <button 
                          onClick={() => setAddress('0x2a3b4c5d6e7f8g9h0i1j')}
                          className="text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 bg-gray-800/50 rounded-md"
                        >
                          Warning Address
                        </button>
                        <button 
                          onClick={() => setAddress('0x3a4b5c6d7e8f9g0h1i2j')}
                          className="text-blue-400 hover:text-blue-300 transition-colors py-1 px-2 bg-gray-800/50 rounded-md"
                        >
                          Dangerous Address
                        </button>
                      </div>
                      
                      {/* Scan Results Area */}
                      <div className="mt-5">
                        {isScanning ? (
                          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50 scanning-effect">
                            <div className="flex flex-col items-center">
                              <div className="h-10 w-10 bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                                <Search className="h-5 w-5 text-blue-400" />
                              </div>
                              <p className="font-heading text-sm font-medium text-blue-400 mb-1">AI Scanning Address</p>
                              <p className="font-body text-xs text-gray-500 mb-3">Analyzing on-chain data and connections...</p>
                              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full animate-pulse-slow" style={{ width: '60%' }}></div>
                              </div>
                            </div>
                          </div>
                        ) : scanResult ? (
                          <div className={`bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border ${
                            scanResult.status === 'safe' 
                              ? 'border-green-700/50' 
                              : scanResult.status === 'warning'
                                ? 'border-amber-700/50'
                                : 'border-red-700/50'
                          }`}>
                            <div className="flex items-start">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                                scanResult.status === 'safe' 
                                  ? 'bg-green-900/30' 
                                  : scanResult.status === 'warning'
                                    ? 'bg-amber-900/30'
                                    : 'bg-red-900/30'
                              }`}>
                                {getStatusIcon(scanResult.status)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <h4 className={`font-heading font-bold ${
                                    scanResult.status === 'safe' 
                                      ? 'text-green-400' 
                                      : scanResult.status === 'warning'
                                        ? 'text-amber-400'
                                        : 'text-red-400'
                                  }`}>
                                    {scanResult.title}
                                  </h4>
                                  <div className="text-right">
                                    <div className="font-body text-xs text-gray-500">Risk Score</div>
                                    <div className={`font-heading font-bold ${getRiskColor(scanResult.riskScore ?? 0)}`}>
                                      {scanResult.riskScore ?? 0}/100
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="font-body text-sm text-gray-300 mt-1 mb-3">{scanResult.message}</p>
                                
                                <div className="bg-gray-900/70 rounded-lg p-2.5 font-body text-xs text-gray-400 mb-3">
                                  <div className="flex justify-between mb-1">
                                    <span>Address:</span>
                                    <span className="font-mono">{scanResult.address}</span>
                                  </div>
                                  <div className="flex justify-between mb-1">
                                    <span>Transactions:</span>
                                    <span>{scanResult.details?.transactions ?? 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between mb-1">
                                    <span>Account Age:</span>
                                    <span>{scanResult.details?.age ?? 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Connections:</span>
                                    <span>{scanResult.details?.connections ?? 'N/A'}</span>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-3">
                                  <button
                                    className={`px-4 py-2 font-heading text-sm font-medium rounded-lg transition-colors ${
                                      scanResult.status === 'safe' 
                                        ? 'bg-green-600 hover:bg-green-500 text-white' 
                                        : scanResult.status === 'warning'
                                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                                    }`}
                                  >
                                    {scanResult.status === 'safe' 
                                      ? 'Proceed Safely' 
                                      : scanResult.status === 'warning'
                                        ? 'Proceed with Caution'
                                        : 'Do Not Proceed'}
                                  </button>
                                  <button className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors">
                                    <ExternalLink className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl p-5 border border-blue-800/30">
                            <div className="flex items-center">
                              <Shield className="h-5 w-5 text-blue-400 mr-3" />
                              <p className="font-body text-sm text-blue-200">
                                Enter any blockchain address above to check if it's safe to interact with.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Recent Scans */}
                      {scanHistory.length > 0 && (
                        <div className="mt-5">
                          <h4 className="font-heading text-sm font-medium text-gray-300 mb-2">Recent Scans</h4>
                          <div className="space-y-2">
                            {scanHistory.map((scan, index) => (
                              <div key={index} className="flex items-center bg-gray-800/50 rounded-lg p-2.5 border border-gray-700/30 hover:border-gray-600/50 transition-colors">
                                <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(scan.status)}`}></div>
                                <span className="font-mono text-xs text-gray-400 truncate flex-1">{scan.address}</span>
                                <span className="font-body text-xs text-gray-500 ml-2">{scan.riskScore}/100</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Security Stats Section */}
        <section 
          className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-950"
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-xl border border-gray-800 overflow-hidden p-6 md:p-8">
              <h2 className="font-heading text-2xl md:text-3xl font-bold mb-6 text-center">Crypto Security Crisis</h2>
              
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-800 mb-6 overflow-x-auto hide-scrollbar">
                {['losses', 'attacks', 'recovery'].map((tab, index) => (
                  <button 
                    key={tab}
                    className={`py-3 px-4 font-heading text-sm font-medium whitespace-nowrap ${
                      activeTab === tab 
                        ? 'bg-gray-800 text-white' 
                        : 'bg-transparent text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {index === 0 ? 'Yearly Losses' : index === 1 ? 'Attack Vectors' : 'Recovery Rates'}
                  </button>
                ))}
              </div>
              
              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'losses' && (
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white mb-4">Crypto Hack Losses by Year</h3>
                    <p className="font-body text-sm text-gray-300 mb-6">
                      The data paints a stark picture of an ecosystem under siege. In 2024, hackers and malicious actors stole $4.3 billion across 892 security incidents.
                    </p>
                    
                    <div className="space-y-4 max-w-3xl mx-auto">
                      {[
                        { year: '2020', amount: '$1.9B', percentage: '44%' },
                        { year: '2021', amount: '$3.2B', percentage: '74%' },
                        { year: '2022', amount: '$3.8B', percentage: '88%' },
                        { year: '2023', amount: '$3.8B', percentage: '88%' },
                        { year: '2024', amount: '$4.3B', percentage: '100%', highlight: true }
                      ].map((data, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-2">
                            <span className={`font-body text-sm ${data.highlight ? 'text-white font-bold' : 'text-gray-400'}`}>
                              {data.year}
                            </span>
                            <span className={`font-heading text-sm ${data.highlight ? 'text-white font-bold' : 'text-gray-400'}`}>
                              {data.amount}
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${data.highlight ? 'bg-red-500' : 'bg-red-600/70'}`}
                              style={{ width: data.percentage }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              
                {activeTab === 'attacks' && (
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white mb-4">Attack Vector Distribution (2024)</h3>
                    <p className="font-body text-sm text-gray-300 mb-6">
                      The threat landscape has evolved significantly, with attackers becoming increasingly sophisticated in their methods.
                    </p>
                    
                    <div className="space-y-4">
                      {[
                        { name: 'Flash Loan Attacks', percentage: '28%', color: 'bg-cyan-500' },
                        { name: 'Private Key Theft', percentage: '24%', color: 'bg-orange-500' },
                        { name: 'Oracle Manipulation', percentage: '18%', color: 'bg-yellow-500' },
                        { name: 'Bridge Exploits', percentage: '16%', color: 'bg-blue-500' },
                        { name: 'Social Engineering', percentage: '7%', color: 'bg-amber-500' }
                      ].map((attack, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-2">
                            <span className="font-body text-sm text-gray-300">{attack.name}</span>
                            <span className="font-heading text-sm text-gray-300">{attack.percentage}</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${attack.color}`}
                              style={{ width: attack.percentage }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'recovery' && (
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white mb-4">Recovery Rate by Hack Size</h3>
                    <p className="font-body text-sm text-gray-300 mb-6">
                      Larger hacks have exponentially lower recovery rates, making prevention and early intervention critical.
                    </p>
                    
                    <div className="space-y-4">
                      {[
                        { range: '$1M-$10M Hacks', rate: '7.1%', color: 'bg-cyan-500' },
                        { range: '$10M-$50M Hacks', rate: '5.1%', color: 'bg-orange-500' },
                        { range: '$50M-$100M Hacks', rate: '3.0%', color: 'bg-yellow-500' },
                        { range: '$100M+ Hacks', rate: '4.3%', color: 'bg-blue-500' }
                      ].map((hack, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-2">
                            <span className="font-body text-sm text-gray-300">{hack.range}</span>
                            <span className="font-heading text-sm text-gray-300">{hack.rate} Recovery</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${hack.color}`}
                              style={{ width: hack.rate }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 bg-blue-900/20 rounded-xl p-4 border border-blue-800/30">
                      <div className="flex items-start">
                        <Shield className="h-5 w-5 text-blue-400 mr-2.5 mt-0.5 flex-shrink-0" />
                        <p className="font-body text-sm text-blue-200">
                          <span className="font-heading font-bold">AI SecureVault™</span> can automatically detect and reverse unauthorized transactions within the SafientAI protection window.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* Interactive Crypto Carousel Section */}
        <section 
          className="py-16 px-4 relative overflow-hidden"
        >
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full"></div>
            <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-violet-500/5 blur-[120px] rounded-full"></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-8">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-900/20 border border-indigo-500/30 mb-4">
                <Globe className="h-3.5 w-3.5 text-indigo-400 mr-2" />
                <span className="font-heading text-sm font-medium text-indigo-400">Supported Cryptocurrencies</span>
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-4">Top Cryptocurrencies Protected</h2>
              <p className="font-body text-lg text-gray-300">
                Our AI security works across all major blockchain networks with a unified protection layer.
              </p>
            </div>

            {/* Interactive Crypto Carousel */}
            <div className="mt-6 relative overflow-hidden py-8">
              <CryptoCarousel />
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full"></div>
            <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-violet-500/5 blur-[120px] rounded-full"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-900/20 border border-blue-500/30 mb-4 sm:mb-6">
                <Award className="h-3.5 w-3.5 text-blue-400 mr-2" />
                <span className="text-xs sm:text-sm font-medium text-blue-400">Why We're Unique</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">The Safient AI Advantage</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300">
                See how our AI-powered security and fund recovery capabilities set us apart from every other wallet.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-xl">
              <div className="p-5 sm:p-6 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:w-1/3">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Wallet Comparison</h3>
                    <p className="text-sm sm:text-base text-gray-300 mb-6 sm:mb-8 hidden lg:block">
                      See how Safient's exclusive AI-powered protection compares to other wallets.
                    </p>
                    
                    <div className="relative inline-block">
                      <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full py-1 px-3 sm:px-4 shadow-lg z-10">
                        <span className="text-[10px] sm:text-xs font-bold text-white">ONLY WE HAVE THIS</span>
                      </div>
                      <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl p-4 sm:p-6 shadow-lg relative">
                        <div className="flex items-center justify-center mb-3 sm:mb-4">
                          <FaMicrochip className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">AI Fund Recovery</h4>
                        <p className="text-xs sm:text-sm text-blue-200">
                          The industry's only wallet with AI-powered threat detection and automatic fund recovery.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:w-2/3">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="bg-gray-800 text-left">
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-300 rounded-tl-lg">Feature</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-blue-400 text-center">Safient</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-300 text-center">Standard</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-300 text-center rounded-tr-lg">Exchange</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {[
                            'AI-Powered Fund Recovery',
                            'Real-Time Threat Analysis',
                            'Blacklisted Address Detection',
                            'Transaction Protection',
                            'Multi-Chain Protection',
                            'Self-Learning Security',
                            'Automatic Hack Detection'
                          ].map((feature, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-gray-900/50' : 'bg-gray-900/80'}>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-300">{feature}</td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-center bg-blue-900/20">
                                {index === 0 ? (
                                  <div className="flex items-center justify-center">
                                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-1 sm:mr-1.5" />
                                    <span className="font-bold text-blue-400">YES</span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-blue-400">YES</span>
                                )}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-center text-gray-400">NO</td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-center text-gray-400">
                                {index === 2 || index === 4 ? 'SOME' : index === 1 ? 'MINIMAL' : 'NO'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-5 sm:mt-6 px-4 sm:px-6">
                      <div className="flex items-start">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-gray-300">
                          <span className="font-bold text-blue-400">Safient AI Advantage:</span> Our unique AI security system not only detects threats but can automatically recover your funds from unauthorized transactions - a capability no other wallet can match.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Interactive Demo */}
        <section 
          className="py-16 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl shadow-2xl overflow-hidden border border-gray-800 p-6">
              <h3 className="font-heading text-2xl font-bold text-white text-center mb-8">Experience AI SecureVault™ Protection</h3>
              
              <div className="flex flex-col items-center">
                <div className="w-full max-w-lg bg-gray-800/70 rounded-xl p-6 relative overflow-hidden border border-gray-700">
                  {/* Progress bar at bottom of card */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-violet-600 transition-all duration-1000"
                    style={{ width: `${100 - (aiProcessing / (30 * 60) * 100)}%` }}
                  ></div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div className="flex items-center mb-3 sm:mb-0">
                      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-lg relative overflow-hidden flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/50"></div>
                        <img 
                          src={`/crypto-icon/${selectedCrypto}.png`}
                          alt={cryptos.find(c => c.id === selectedCrypto)?.name}
                          className="h-6 w-6 relative z-10 object-contain"
                          onError={handleImgError}
                        />
                      </div>
                      <div>
                        <p className="font-body text-sm text-gray-400">From</p>
                        <p className="font-heading text-base text-gray-200 font-medium">Your Wallet</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-500 hidden sm:block" />
                    <div className="transform rotate-90 sm:hidden mb-3">
                      <ArrowRight className="h-5 w-5 text-gray-500" />
                    </div>
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-lg relative overflow-hidden flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-white/50"></div>
                        <img 
                          src={`/crypto-icon/${selectedCrypto}.png`}
                          alt={cryptos.find(c => c.id === selectedCrypto)?.name}
                          className="h-6 w-6 relative z-10 object-contain"
                          onError={handleImgError}
                        />
                      </div>
                      <div>
                        <p className="font-body text-sm text-gray-400">To</p>
                        <p className="font-heading text-base text-gray-200 font-medium">Recipient</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700 mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-body text-sm text-gray-400">Amount</span>
                      <span className="font-heading text-base font-bold text-white">10 {cryptos.find(c => c.id === selectedCrypto)?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-body text-sm text-gray-400">Status</span>
                      <span className="font-heading text-sm text-white font-medium flex items-center">
                        <Shield className="h-4 w-4 mr-1.5" />
                        <span className="font-sans text-white font-semibold tracking-wide">Safient</span> {isAnimating ? 'Active' : 'AI Protection'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <p className="font-body text-sm text-gray-400">SafientAI Analysis</p>
                      <p className="font-mono text-2xl font-bold text-white">{isAnimating ? 'Processing...' : 'Ready to Protect'}</p>
                    </div>
                    <button 
                      onClick={toggleAnimation} 
                      className={`px-5 py-3 text-white rounded-xl shadow-lg transition-all duration-300 font-heading text-sm ${
                        isAnimating 
                          ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400' 
                          : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500'
                      }`}
                    >
                      {isAnimating ? 'Cancel Transfer' : 'Start Demo'}
                    </button>
                  </div>
                </div>
                
                <p className="font-body text-sm text-gray-400 mt-4 text-center">
                  Click "Start Demo" to see how the AI SecureVault™ protection works in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 sm:py-20 md:py-24 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950 to-gray-950/95"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-900/20 border border-indigo-500/30 mb-4 sm:mb-6">
                <FileText className="h-3.5 w-3.5 text-indigo-400 mr-2" />
                <span className="text-xs sm:text-sm font-medium text-indigo-400">FAQ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Frequently Asked Questions</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-300">
                Common questions about our AI security and fund recovery capabilities.
              </p>
            </div>

            <div className="max-w-3xl mx-auto divide-y divide-gray-800">
              {[
                {
                  question: "How does the AI fund recovery actually work?",
                  answer: "Our AI monitors all transactions for suspicious patterns. When you send funds, they're held in our secure Safient system with SafientAI Model Protection. During this time, our AI continuously analyzes the transaction against known threats and blacklisted addresses. If it detects suspicious activity, it can automatically reverse the transaction. You can also manually cancel any transaction within this window, giving you unprecedented control over your funds even after sending."
                },
                {
                  question: "How does the AI detect malicious transactions?",
                  answer: "Our proprietary AI uses a combination of techniques including behavior analysis, blacklist integration, and anomaly detection. It maintains a constantly updated database of over 8.7 million known malicious addresses and analyzes over 200 risk factors for each transaction. The system can identify suspicious patterns that would be invisible to human eyes, identifying both known threats and zero-day exploits with 99.7% accuracy."
                },
                {
                  question: "Can your AI really recover funds after they're sent?",
                  answer: "Yes, that's what makes Safient unique. While traditional wallets offer no recourse once funds are sent, our AI SecureVault™ holds all transactions in a secure Safient with SafientAI Model Protection. This creates a critical window where the AI can detect threats and automatically recover your funds, or you can manually cancel the transaction if you spot a mistake or suspicious activity."
                },
                {
                  question: "Is my biometric data secure with the AI system?",
                  answer: "Absolutely. Your biometric data is processed using AES-256 encryption and is never transmitted to our servers. The AI only works with the encrypted signature that's stored securely on your device with military-grade protection. Even in the unlikely event of a data breach, your actual biometric data cannot be reconstructed from the encrypted signature."
                },
                {
                  question: "How does the AI help with different blockchains?",
                  answer: "Our AI security layer works across all supported blockchains, providing a unified protection system regardless of which cryptocurrency you're using. It analyzes blockchain-specific threats and vulnerabilities, adapting its security measures to the unique characteristics of each network while maintaining consistent protection standards."
                }
              ].map((faq, index) => (
                <div key={index} className="py-5 sm:py-6">
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                    className="flex justify-between items-start w-full text-left"
                  >
                    <h4 className="text-base sm:text-lg font-medium text-white pr-8">{faq.question}</h4>
                    <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center ${activeAccordion === index ? 'bg-blue-600' : 'bg-gray-800'} transition-colors duration-300 flex-shrink-0`}>
                      <ChevronDown
                        className={`h-4 w-4 sm:h-5 sm:w-5 text-white transform transition-transform duration-300 ${
                          activeAccordion === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>
                  <div className={`mt-3 sm:mt-4 transition-all duration-500 overflow-hidden ${
                    activeAccordion === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <p className="text-xs sm:text-sm text-gray-300 pr-4 sm:pr-8">{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Box */}
        <section 
          className="py-16 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-blue-900/30 to-violet-900/30 rounded-2xl p-6 sm:p-8 border border-blue-800/30">
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 border border-white/20 mb-4">
                  <Shield className="h-3.5 w-3.5 text-blue-300 mr-2" />
                  <span className="font-heading text-sm font-medium text-blue-300">AI-POWERED SECURITY</span>
                </div>
                <h3 className="font-heading text-2xl md:text-3xl font-bold text-white mb-3">Ready to secure your crypto?</h3>
                <p className="font-body text-lg text-blue-200 mb-6">
                  Join thousands of users who trust Safient's industry-first AI SecureVault™ technology to protect their assets.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <button 
                      onClick={handleCreateWallet}
                      className="px-5 py-2.5 bg-white text-blue-900 rounded-xl font-heading font-medium shadow-lg flex items-center justify-center"
                    >
                      Create Wallet <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                    <button
                      onClick={handleImportWallet}
                      className="px-5 py-2.5 bg-transparent text-white border border-white/20 rounded-xl font-heading font-medium shadow-lg transition-all duration-300 flex items-center justify-center"
                    >
                      Import Wallet
                    </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Footer Component */}
      <Footer />
    </div>
  );
}