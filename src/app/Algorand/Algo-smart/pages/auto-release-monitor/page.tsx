'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Play, Settings } from 'lucide-react';

interface AutoReleaseResult {
  success: boolean;
  message?: string;
  results?: {
    checked: number;
    expired: number;
    released: number;
    failed: number;
    skipped: number;
    errors: string[];
  };
  timestamp?: string;
}

export default function AutoReleaseMonitor() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<AutoReleaseResult | null>(null);
  const [autoRun, setAutoRun] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [nextRunIn, setNextRunIn] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  const runAutoRelease = async () => {
    setIsRunning(true);
    addLog('🚀 Starting auto-release check...');

    try {
      const response = await fetch('/Algorand/Algo-smart/api/auto-release', {
        method: 'GET'
      });

      const data = await response.json();
      setLastResult(data);

      if (data.success) {
        addLog(`✅ Auto-release completed: ${data.results?.released || 0} transactions released`);
        if (data.results?.errors && data.results.errors.length > 0) {
          data.results.errors.forEach((error: string) => addLog(`⚠️ ${error}`));
        }
      } else {
        addLog(`❌ Auto-release failed: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLastResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunning(false);
      setNextRunIn(intervalMinutes * 60);
    }
  };

  // Auto-run countdown
  useEffect(() => {
    if (autoRun && nextRunIn > 0) {
      const timer = setInterval(() => {
        setNextRunIn(prev => {
          if (prev <= 1) {
            runAutoRelease();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [autoRun, nextRunIn]);

  // Initial run on mount
  useEffect(() => {
    addLog('🎯 Auto-Release Monitor initialized');
    if (autoRun) {
      runAutoRelease();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">SafientAI Auto-Release Monitor</h1>
              <p className="text-gray-400">Automatically releases expired escrow funds to recipients</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg ${autoRun ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${autoRun ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  {autoRun ? 'Auto-Run Active' : 'Manual Mode'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={runAutoRelease}
              disabled={isRunning}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Run Now
                </>
              )}
            </button>

            <div className="flex items-center space-x-4 bg-gray-800/50 px-6 py-3 rounded-xl">
              <Settings className="h-5 w-5 text-gray-400" />
              <label className="text-sm text-gray-400">Interval:</label>
              <select
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                className="bg-gray-700 text-white px-3 py-1 rounded-lg"
              >
                <option value={1}>1 minute</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>

            <button
              onClick={() => setAutoRun(!autoRun)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                autoRun
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {autoRun ? 'Disable Auto-Run' : 'Enable Auto-Run'}
            </button>

            {autoRun && nextRunIn > 0 && (
              <div className="flex items-center space-x-2 text-gray-400">
                <Clock className="h-5 w-5" />
                <span>Next run in: {formatTime(nextRunIn)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className={`bg-gray-900/80 backdrop-blur-xl rounded-2xl border ${
            lastResult.success ? 'border-green-500/30' : 'border-red-500/30'
          } p-6 mb-6`}>
            <div className="flex items-center mb-4">
              {lastResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400 mr-3" />
              )}
              <h2 className="text-xl font-bold">
                {lastResult.success ? 'Last Run Successful' : 'Last Run Failed'}
              </h2>
              {lastResult.timestamp && (
                <span className="ml-auto text-sm text-gray-400">{new Date(lastResult.timestamp).toLocaleString()}</span>
              )}
            </div>

            {lastResult.results && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Checked</p>
                  <p className="text-2xl font-bold">{lastResult.results.checked}</p>
                </div>
                <div className="bg-blue-900/20 rounded-xl p-4">
                  <p className="text-blue-400 text-sm mb-1">Expired</p>
                  <p className="text-2xl font-bold text-blue-400">{lastResult.results.expired}</p>
                </div>
                <div className="bg-green-900/20 rounded-xl p-4">
                  <p className="text-green-400 text-sm mb-1">Released</p>
                  <p className="text-2xl font-bold text-green-400">{lastResult.results.released}</p>
                </div>
                <div className="bg-red-900/20 rounded-xl p-4">
                  <p className="text-red-400 text-sm mb-1">Failed</p>
                  <p className="text-2xl font-bold text-red-400">{lastResult.results.failed}</p>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <p className="text-gray-400 text-sm mb-1">Skipped</p>
                  <p className="text-2xl font-bold">{lastResult.results.skipped}</p>
                </div>
              </div>
            )}

            {lastResult.results?.errors && lastResult.results.errors.length > 0 && (
              <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <h3 className="font-semibold text-red-400">Errors ({lastResult.results.errors.length})</h3>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {lastResult.results.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-300">• {error}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs */}
        <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Activity Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear Logs
            </button>
          </div>
          <div className="bg-black/50 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-gray-300 mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-3 text-blue-400">🔧 Production Setup Instructions</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p><strong>Option 1: Vercel Cron Jobs</strong></p>
            <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto text-xs">
{`// vercel.json
{
  "crons": [{
    "path": "/Algorand/Algo-smart/api/cron-auto-release",
    "schedule": "*/5 * * * *"  // Every 5 minutes
  }]
}`}
            </pre>
            
            <p className="mt-4"><strong>Option 2: External Cron Service (cron-job.org, EasyCron)</strong></p>
            <p>Set up a cron job to call: <code className="bg-black/50 px-2 py-1 rounded">https://your-domain.com/Algorand/Algo-smart/api/cron-auto-release</code></p>
            <p>Add header: <code className="bg-black/50 px-2 py-1 rounded">Authorization: Bearer safient-cron-secret-2024</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}

