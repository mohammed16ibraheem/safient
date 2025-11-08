'use client';

import { useState, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

interface MnemonicInputProps {
  words: string[];
  onChange: (words: string[]) => void;
  disabled?: boolean;
}

export default function MnemonicInput({ words, onChange, disabled = false }: MnemonicInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleWordChange = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value.toLowerCase().trim();
    onChange(newWords);
  };

  // Enhanced paste handler function
  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const pastedWords = pastedText.trim().split(/\s+/).filter(word => word.length > 0);
    
    console.log('Pasted words:', pastedWords.length, pastedWords);
    
    if (pastedWords.length > 1) {
      const newWords = [...words];
      
      // Always start filling from index 0 for multi-word pastes
      const startIndex = 0;
      
      // Fill up to 25 words (Algorand standard)
      for (let i = 0; i < Math.min(pastedWords.length, 25); i++) {
        if (startIndex + i < 25) {
          newWords[startIndex + i] = pastedWords[i].toLowerCase().trim();
        }
      }
      
      console.log('New words array:', newWords.length, newWords);
      onChange(newWords);
      
      // Focus the next empty field or the last filled field
      const nextEmptyIndex = newWords.findIndex((word, idx) => idx > startIndex + pastedWords.length - 1 && !word.trim());
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(startIndex + pastedWords.length - 1, 24);
      
      setTimeout(() => {
        inputRefs.current[focusIndex]?.focus();
      }, 100);
    } else {
      // Single word paste
      handleWordChange(index, pastedText);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < 24) {
        inputRefs.current[nextIndex]?.focus();
      }
    } else if (e.key === 'Backspace' && words[index] === '') {
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        inputRefs.current[prevIndex]?.focus();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <AlertCircle className="h-4 w-4" />
        <span>Enter your 24-word recovery phrase in the correct order</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 relative">
        {words.map((word, index) => (
          <div key={index} className="relative">
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-mono">
                {index + 1}
              </span>
              <input
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                value={word}
                onChange={(e) => handleWordChange(index, e.target.value)}
                onPaste={(e) => handlePaste(index, e)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => {
                  setTimeout(() => {
                    setFocusedIndex(null);
                  }, 200);
                }}
                disabled={disabled}
                className={`
                  w-full pl-8 pr-3 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-500
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                  ${word ? 'border-green-500 bg-green-500/10' : 'border-gray-600'}
                `}
                placeholder="word"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            
            {/* Word validation indicator */}
            {word && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Progress</span>
          <span>{words.filter(w => w.trim()).length}/25 words</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(words.filter(w => w.trim()).length / 24) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}