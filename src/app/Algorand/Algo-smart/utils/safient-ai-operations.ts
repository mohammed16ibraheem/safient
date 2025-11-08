// Safient AI Operations - Core utility functions for secure transfers
// This module handles the business logic for Safient AI transfers

import * as algosdk from 'algosdk';
import { 
  SafientAITransfer, 
  SafientAIStatus, 
  SafientAIValidation, 
  SafientAIFormData,
  CreateSafientAIRequest,
  SafientAISettings
} from '../types/safient-ai';

// Default Safient AI settings
export const DEFAULT_SAFIENT_AI_SETTINGS: SafientAISettings = {
  lockDuration: 30, // 30 minutes
  minTransferAmount: 100000, // 0.1 ALGO in microAlgos
  maxTransferAmount: 1000000000, // 1000 ALGO in microAlgos
  feePercentage: 0, // No fees for now
  enableNotifications: true,
  autoReleaseEnabled: true
};

/**
 * Generate a unique Safient AI transfer ID
 */
export function generateSafientAIId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `sai_${timestamp}_${randomStr}`;
}

/**
 * Calculate expiration time for a Safient AI transfer
 */
export function calculateExpirationTime(lockDurationMinutes: number = 30): Date {
  const now = new Date();
  return new Date(now.getTime() + (lockDurationMinutes * 60 * 1000));
}

/**
 * Check if a Safient AI transfer is still active (not expired)
 */
export function isSafientAIActive(transfer: SafientAITransfer): boolean {
  const now = new Date();
  return transfer.expiresAt > now && transfer.status === 'active';
}

/**
 * Calculate remaining time in seconds for a Safient AI transfer
 */
export function getRemainingTime(expiresAt: Date): number {
  const now = new Date();
  const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
  return remaining;
}

/**
 * Format remaining time as human-readable string
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/**
 * Validate Safient AI form data
 */
export function validateSafientAIForm(formData: SafientAIFormData): SafientAIValidation {
  const errors: Record<string, string> = {};
  const warnings: Record<string, string> = {};

  // Validate recipient address
  if (!formData.recipientAddress.trim()) {
    errors.recipientAddress = 'Recipient address is required';
  } else if (!algosdk.isValidAddress(formData.recipientAddress)) {
    errors.recipientAddress = 'Invalid Algorand address';
  }

  // Validate amount
  const amount = parseFloat(formData.amount);
  if (!formData.amount || isNaN(amount) || amount <= 0) {
    errors.amount = 'Please enter a valid amount';
  } else {
    const microAlgos = algosdk.algosToMicroalgos(amount);
    if (microAlgos < DEFAULT_SAFIENT_AI_SETTINGS.minTransferAmount) {
      errors.amount = `Minimum transfer amount is ${algosdk.microalgosToAlgos(DEFAULT_SAFIENT_AI_SETTINGS.minTransferAmount)} ALGO`;
    } else if (microAlgos > DEFAULT_SAFIENT_AI_SETTINGS.maxTransferAmount) {
      errors.amount = `Maximum transfer amount is ${algosdk.microalgosToAlgos(DEFAULT_SAFIENT_AI_SETTINGS.maxTransferAmount)} ALGO`;
    }
  }

  // Validate lock duration
  if (formData.lockDurationMinutes < 5) {
    errors.lockDurationMinutes = 'Lock duration must be at least 5 minutes';
  } else if (formData.lockDurationMinutes > 1440) { // 24 hours
    errors.lockDurationMinutes = 'Lock duration cannot exceed 24 hours';
  }

  // Add warnings
  if (amount > 100) {
    warnings.amount = 'Large transfer amount - please double-check recipient address';
  }

  if (formData.lockDurationMinutes > 60) {
    warnings.lockDurationMinutes = 'Long lock duration - funds will be locked for over 1 hour';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

/**
 * Create a Safient AI transfer request object
 */
export function createSafientAIRequest(
  formData: SafientAIFormData,
  senderMnemonic: string
): CreateSafientAIRequest {
  return {
    recipientAddress: formData.recipientAddress.trim(),
    amount: parseFloat(formData.amount),
    senderMnemonic,
    lockDurationMinutes: formData.lockDurationMinutes,
    metadata: {
      purpose: formData.purpose.trim() || undefined,
      priority: 'normal'
    }
  };
}

/**
 * Create a new Safient AI transfer object
 */
export function createSafientAITransfer(
  request: CreateSafientAIRequest,
  senderAddress: string,
  contractAddress?: string
): SafientAITransfer {
  const now = new Date();
  const expiresAt = calculateExpirationTime(request.lockDurationMinutes);

  return {
    id: generateSafientAIId(),
    senderAddress: senderAddress,
    recipientAddress: request.recipientAddress,
    amount: request.amount,
    status: 'pending',
    createdAt: now,
    expiresAt,
    contractAddress,
    metadata: request.metadata
  };
}

/**
 * Update Safient AI transfer status
 */
export function updateSafientAIStatus(
  transfer: SafientAITransfer,
  newStatus: SafientAIStatus,
  transactionId?: string
): SafientAITransfer {
  const updatedTransfer = { ...transfer, status: newStatus };

  switch (newStatus) {
    case 'active':
      updatedTransfer.transactionId = transactionId;
      break;
    case 'reclaimed':
      updatedTransfer.reclaimTransactionId = transactionId;
      break;
    case 'completed':
      updatedTransfer.releaseTransactionId = transactionId;
      break;
  }

  return updatedTransfer;
}

/**
 * Check if a transfer can be reclaimed
 */
export function canReclaimSafientAI(transfer: SafientAITransfer): boolean {
  return transfer.status === 'active' && isSafientAIActive(transfer);
}

/**
 * Calculate Safient AI fee (if any)
 */
export function calculateSafientAIFee(amount: number): number {
  return Math.floor(amount * DEFAULT_SAFIENT_AI_SETTINGS.feePercentage / 100);
}

/**
 * Get Safient AI transfer summary for display
 */
export function getSafientAITransferSummary(transfer: SafientAITransfer) {
  const amountInAlgo = algosdk.microalgosToAlgos(transfer.amount);
  const remainingTime = getRemainingTime(transfer.expiresAt);
  const formattedTime = formatRemainingTime(remainingTime);
  
  return {
    id: transfer.id,
    amount: amountInAlgo,
    amountFormatted: `${amountInAlgo.toFixed(6)} ALGO`,
    status: transfer.status,
    remainingTime,
    remainingTimeFormatted: formattedTime,
    canReclaim: canReclaimSafientAI(transfer),
    isExpired: remainingTime <= 0,
    recipientAddress: transfer.recipientAddress,
    senderAddress: transfer.senderAddress,
    purpose: transfer.metadata?.purpose || 'Safient AI Transfer'
  };
}

/**
 * Filter transfers by status
 */
export function filterSafientAITransfers(
  transfers: SafientAITransfer[],
  status?: SafientAIStatus
): SafientAITransfer[] {
  if (!status) return transfers;
  return transfers.filter(transfer => transfer.status === status);
}

/**
 * Sort transfers by creation date (newest first)
 */
export function sortSafientAITransfers(transfers: SafientAITransfer[]): SafientAITransfer[] {
  return [...transfers].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get Safient AI statistics from transfer history
 */
export function getSafientAIStats(transfers: SafientAITransfer[]) {
  const totalTransfers = transfers.length;
  const activeTransfers = transfers.filter(t => t.status === 'active').length;
  const completedTransfers = transfers.filter(t => t.status === 'completed').length;
  const reclaimedTransfers = transfers.filter(t => t.status === 'reclaimed').length;
  
  const totalVolume = transfers.reduce((sum, t) => sum + t.amount, 0);
  const averageTransferAmount = totalTransfers > 0 ? totalVolume / totalTransfers : 0;

  return {
    totalTransfers,
    activeTransfers,
    completedTransfers,
    reclaimedTransfers,
    totalVolume: algosdk.microalgosToAlgos(totalVolume),
    averageTransferAmount: algosdk.microalgosToAlgos(averageTransferAmount)
  };
}

export default {
  generateSafientAIId,
  calculateExpirationTime,
  isSafientAIActive,
  getRemainingTime,
  formatRemainingTime,
  validateSafientAIForm,
  createSafientAIRequest,
  createSafientAITransfer,
  updateSafientAIStatus,
  canReclaimSafientAI,
  getSafientAITransferSummary,
  filterSafientAITransfers,
  sortSafientAITransfers,
  getSafientAIStats
};