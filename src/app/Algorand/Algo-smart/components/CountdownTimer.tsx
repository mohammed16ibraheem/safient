'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getRemainingTime, formatRemainingTime } from '../utils/safient-ai-operations';

interface CountdownTimerProps {
  expirationTime: number;
  onExpired?: () => void;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  expirationTime,
  onExpired,
  className = '',
  showIcon = true,
  size = 'md'
}) => {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const remaining = getRemainingTime(new Date(expirationTime));
      setRemainingTime(remaining);
      
      if (remaining <= 0 && !isExpired) {
        setIsExpired(true);
        if (onExpired) {
          onExpired();
        }
      }
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expirationTime, isExpired, onExpired]);

  const formattedTime = formatRemainingTime(remainingTime);

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'text-sm',
      icon: 'h-4 w-4',
      text: 'text-sm'
    },
    md: {
      container: 'text-base',
      icon: 'h-5 w-5',
      text: 'text-base'
    },
    lg: {
      container: 'text-lg',
      icon: 'h-6 w-6',
      text: 'text-lg font-semibold'
    }
  };

  const currentSize = sizeClasses[size];

  // Color classes based on remaining time
  const getColorClasses = () => {
    if (isExpired || remainingTime <= 0) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (remainingTime <= 300) { // Less than 5 minutes
      return 'text-orange-600 bg-orange-50 border-orange-200';
    } else if (remainingTime <= 900) { // Less than 15 minutes
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const colorClasses = getColorClasses();

  const getStatusText = () => {
    if (isExpired || remainingTime <= 0) {
      return 'Expired';
    } else if (remainingTime <= 60) {
      return 'Expiring Soon';
    } else {
      return 'Active';
    }
  };

  const getProgressPercentage = () => {
    // Assuming a typical lock duration for progress calculation
    // This could be improved by passing the original lock duration
    const totalDuration = 1800; // 30 minutes default
    const elapsed = totalDuration - remainingTime;
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  return (
    <div className={`${className}`}>
      {/* Timer Display */}
      <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${colorClasses} ${currentSize.container}`}>
        {showIcon && (
          <Clock className={`${currentSize.icon} ${isExpired ? 'animate-pulse' : ''}`} />
        )}
        <div className="flex flex-col">
          <span className={`font-mono ${currentSize.text}`}>
            {formattedTime}
          </span>
          <span className="text-xs opacity-75">
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {!isExpired && remainingTime > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                remainingTime <= 300 ? 'bg-red-500' :
                remainingTime <= 900 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${100 - getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Started</span>
            <span>Expires</span>
          </div>
        </div>
      )}

      {/* Expired Message */}
      {(isExpired || remainingTime <= 0) && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center space-x-1 text-red-600 text-sm">
            <Clock className="h-4 w-4" />
            <span>Protection period has ended</span>
          </div>
        </div>
      )}

      {/* Warning Messages */}
      {!isExpired && remainingTime > 0 && (
        <div className="mt-2">
          {remainingTime <= 60 && (
            <div className="text-center text-red-600 text-sm font-medium animate-pulse">
              ⚠️ Less than 1 minute remaining!
            </div>
          )}
          {remainingTime <= 300 && remainingTime > 60 && (
            <div className="text-center text-orange-600 text-sm">
              ⏰ Less than 5 minutes remaining
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;