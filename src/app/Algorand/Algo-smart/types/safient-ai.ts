// Safient AI Types - Core interfaces for the Safient AI secure transfer system
// Note: This system provides secure fund transfers with reclaim protection

export interface SafientAITransfer {
  id: string;
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  status: SafientAIStatus;
  createdAt: Date;
  expiresAt: Date;
  contractAddress?: string;
  transactionId?: string;
  reclaimTransactionId?: string;
  releaseTransactionId?: string;
  metadata?: SafientAIMetadata;
}

export type SafientAIStatus = 
  | 'pending'        // Transfer initiated, waiting for confirmation
  | 'active'         // Funds locked in Safient AI contract, countdown active
  | 'reclaimed'      // Sender reclaimed the funds
  | 'completed'      // Funds automatically released to recipient
  | 'expired'        // Transfer expired (should auto-complete)
  | 'failed';        // Transfer failed for some reason

export interface SafientAIMetadata {
  purpose?: string;           // Optional transfer description
  senderNote?: string;        // Note from sender
  recipientNote?: string;     // Note from recipient
  tags?: string[];           // Optional tags for categorization
  priority?: 'low' | 'normal' | 'high';
}

export interface SafientAIContract {
  contractId: string;
  contractAddress: string;
  creatorAddress: string;
  version: string;
  deployedAt: Date;
  isActive: boolean;
}

export interface SafientAISettings {
  lockDuration: number;       // Duration in minutes (default: 30)
  minTransferAmount: number;  // Minimum transfer amount in microAlgos
  maxTransferAmount: number;  // Maximum transfer amount in microAlgos
  feePercentage: number;      // Fee percentage (if any)
  enableNotifications: boolean;
  autoReleaseEnabled: boolean;
}

export interface SafientAIHistory {
  transfers: SafientAITransfer[];
  totalSent: number;
  totalReceived: number;
  totalReclaimed: number;
  lastActivity: Date;
}

export interface SafientAINotification {
  id: string;
  type: 'transfer_received' | 'transfer_sent' | 'reclaim_available' | 'auto_released' | 'reclaimed';
  title: string;
  message: string;
  transferId: string;
  isRead: boolean;
  createdAt: Date;
}

export interface SafientAIStats {
  totalTransfers: number;
  activeTransfers: number;
  completedTransfers: number;
  reclaimedTransfers: number;
  totalVolume: number;
  averageTransferAmount: number;
}

// API Response types
export interface SafientAIApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateSafientAIRequest {
  recipientAddress: string;
  amount: number;
  senderMnemonic: string;
  lockDurationMinutes: number;
  metadata?: Partial<SafientAIMetadata>;
}

export interface CreateSafientAIResponse {
  success: boolean;
  transferId?: string;
  transactionId?: string;
  appId?: number;
  senderAddress?: string;
  recipientAddress?: string;
  amount?: number;
  lockDurationMinutes?: number;
  expirationTime?: number;
  status?: string;
  blockRound?: number;
  createdAt?: number;
  error?: string;
  details?: Record<string, string>;
}

export interface ReclaimFundsRequest {
  transferId: string;
  senderMnemonic: string;
  signature?: string;
}

export interface ReclaimFundsResponse {
  success: boolean;
  transactionId?: string;
  senderAddress?: string;
  reclaimedAmount?: number;
  blockRound?: number;
  reclaimedAt?: number;
  error?: string;
}

export interface ReleaseFundsRequest {
  transferId: string;
  callerMnemonic: string;
}

export interface ReleaseFundsResponse {
  success: boolean;
  transactionId?: string;
  recipientAddress?: string;
  releasedAmount?: number;
  blockRound?: number;
  releasedAt?: number;
  error?: string;
}

export interface TransferStatusRequest {
  transferId: string;
}

export interface TransferStatusResponse {
  success: boolean;
  transfer?: {
    id: string;
    senderAddress: string;
    recipientAddress: string;
    amount: number;
    lockDurationMinutes: number;
    createdAt: number;
    expirationTime: number;
    status: string;
    transactionHistory: Array<{
      type: string;
      transactionId: string;
      timestamp: number;
      blockRound: number;
    }>;
  };
  remainingTime?: number;
  status?: string;
  senderAddress?: string;
  recipientAddress?: string;
  amount?: number;
  lockDurationMinutes?: number;
  creationTime?: number;
  expirationTime?: number;
  remainingTimeSeconds?: number;
  formattedRemainingTime?: string;
  canReclaim?: boolean;
  canRelease?: boolean;
  isExpired?: boolean;
  appId?: number;
  transactionHistory?: any[];
  error?: string;
}

export interface SafientAIStatusResponse {
  transfer: SafientAITransfer;
  timeRemaining: number; // in seconds
  canReclaim: boolean;
  contractBalance: number;
}

// Smart Contract interaction types
export interface SafientAIContractCall {
  method: 'create' | 'reclaim' | 'release' | 'getStatus';
  params: Record<string, any>;
  senderAddress: string;
}

export interface SafientAIContractResponse {
  success: boolean;
  transactionId?: string;
  contractAddress?: string;
  result?: any;
  error?: string;
}

// UI Component Props
export interface SafientAIComponentProps {
  walletAddress: string;
  balance: number;
  onTransferComplete?: (transfer: SafientAITransfer) => void;
  onError?: (error: string) => void;
}

export interface CountdownTimerProps {
  expiresAt: Date;
  onExpire?: () => void;
  showSeconds?: boolean;
}

export interface SafientAIFormData {
  recipientAddress: string;
  amount: string;
  purpose: string;
  lockDurationMinutes: number;
}

// Validation types
export interface SafientAIValidation {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// Event types for real-time updates
export interface SafientAIEvent {
  type: 'transfer_created' | 'transfer_reclaimed' | 'transfer_completed' | 'transfer_expired';
  transferId: string;
  timestamp: Date;
  data: any;
}

export default SafientAITransfer;