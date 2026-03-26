// components/GaslessTest.tsx - small updates to use smartWalletAddress
'use client';

import { useState } from 'react';
import { useGaslessTransaction } from '../hooks/useGasslessTransaction';

const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready',
  building: '⚙️ Building UserOp...',
  estimating: '📊 Estimating gas...',
  sending: '📤 Sending to bundler...',
  confirming: '⏳ Waiting for confirmation...',
  done: '✅ Done!',
  error: '❌ Error',
};

export default function GaslessTest() {
  const { sendGasless, status, txHash, error, smartWalletAddress } = useGaslessTransaction();
  const [to, setTo] = useState('');
  const [value, setValue] = useState('0.001');

  const isLoading = !['idle', 'done', 'error'].includes(status);

  return (
    <div className="p-6 border rounded-lg max-w-md mt-6 w-full bg-white dark:bg-zinc-900">
      <h2 className="text-xl font-bold mb-4">🧪 Gasless Transaction Test</h2>

      {/* show smart wallet address */}
      {smartWalletAddress && (
        <div className="mb-4 p-2 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono break-all">
          <span className="text-zinc-500">Smart wallet: </span>
          {smartWalletAddress}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Recipient Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-700 p-2 rounded mt-1 text-sm font-mono bg-transparent"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Amount (XDC)
          </label>
          <input
            type="number"
            step="0.001"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border border-zinc-300 dark:border-zinc-700 p-2 rounded mt-1 text-sm bg-transparent"
          />
        </div>

        <button
          onClick={() => sendGasless(to, value)}
          disabled={isLoading || !to || !smartWalletAddress}  // also disable if sdk not ready
          className="bg-indigo-600 text-white font-semibold p-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isLoading ? STATUS_LABELS[status] : 'Send Gasless'}
        </button>
      </div>

      {status !== 'idle' && (
        <div className="mt-4 p-3 rounded bg-zinc-100 dark:bg-zinc-800 text-sm">
          <p className="font-medium">{STATUS_LABELS[status]}</p>
        </div>
      )}

      {txHash && (
        <div className="mt-3 p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm">
          <p className="font-medium text-green-700 dark:text-green-400">Transaction confirmed!</p>
          <a
            href={`https://explorer.apothem.network/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-blue-500 underline break-all mt-1 block"
          >
            {txHash}
          </a>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}