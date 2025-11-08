'use client';

import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportStatus {
  step: 'input' | 'validating' | 'importing' | 'success' | 'error';
  message: string;
  progress: number;
}

interface ImportProgressProps {
  status: ImportStatus;
}

export default function ImportProgress({ status }: ImportProgressProps) {
  const getStepIcon = () => {
    switch (status.step) {
      case 'validating':
      case 'importing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStepColor = () => {
    switch (status.step) {
      case 'validating':
      case 'importing':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getProgressBarColor = () => {
    switch (status.step) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (status.step === 'input') {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-gray-800/30 border border-gray-700/50 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        {getStepIcon()}
        <span className={`font-medium ${getStepColor()}`}>
          {status.message}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Import Progress</span>
          <span>{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-4 text-xs">
        <div className={`flex items-center gap-1 ${
          status.progress >= 25 ? 'text-blue-400' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            status.progress >= 25 ? 'bg-blue-400' : 'bg-gray-600'
          }`}></div>
          <span>Validate</span>
        </div>
        <div className={`flex items-center gap-1 ${
          status.progress >= 75 ? 'text-blue-400' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            status.progress >= 75 ? 'bg-blue-400' : 'bg-gray-600'
          }`}></div>
          <span>Import</span>
        </div>
        <div className={`flex items-center gap-1 ${
          status.progress >= 100 ? 'text-green-400' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            status.progress >= 100 ? 'bg-green-400' : 'bg-gray-600'
          }`}></div>
          <span>Complete</span>
        </div>
      </div>
    </div>
  );
}