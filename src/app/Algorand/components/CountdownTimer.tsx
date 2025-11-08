'use client';

import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  onReclaim?: () => void;
  canReclaim: boolean;
  transferId: string;
  status?: string;
}

interface TimeLeft {
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  expiresAt, 
  onExpire, 
  onReclaim, 
  canReclaim, 
  transferId,
  status
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  // Check if funds were reclaimed or completed (auto-released)
  const isReclaimed = status === 'reclaimed';
  const isCompleted = status === 'completed';

  useEffect(() => {
    // If already reclaimed or completed, stop the timer immediately
    if (isReclaimed || isCompleted) {
      setTimeLeft({
        minutes: 0,
        seconds: 0,
        isExpired: true
      });
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      const difference = expiration - now;

      if (difference > 0) {
        const minutes = Math.floor(difference / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({
          minutes,
          seconds,
          isExpired: false
        });
      } else {
        setTimeLeft({
          minutes: 0,
          seconds: 0,
          isExpired: true
        });
        if (onExpire) onExpire();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire, isReclaimed, isCompleted]);

  // If funds were reclaimed, show success message
  if (isReclaimed) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <span className="text-green-600 font-medium">✅ Funds Reclaimed Successfully</span>
      </div>
    );
  }

  // If funds were auto-released (completed), show completion message
  if (isCompleted) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-green-600 font-medium">✅ Funds Released to Recipient</span>
      </div>
    );
  }

  // If timer expired and funds were NOT reclaimed/completed yet, show expired message
  if (timeLeft.isExpired && !isReclaimed && !isCompleted) {
    return (
      <div className="flex items-center space-x-2 text-orange-600">
        <Clock className="w-4 h-4" />
        <span className="text-orange-600 font-medium">⏰ Timer Expired - Awaiting Auto-Release</span>
      </div>
    );
  }

  // Show active countdown timer
  return (
    <div className="flex items-center space-x-2 text-blue-600">
      <Clock className="w-4 h-4" />
      <span className="font-mono text-lg font-bold">
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
      <span className="text-sm text-gray-600">
        ({timeLeft.minutes} minutes remaining)
      </span>
    </div>
  );
};

export default CountdownTimer;