'use client';

import { useState } from 'react';
import { useTransactionKit } from '../hooks/useTransactionKit';

// Minimal XDC unit conversion (1 XDC = 1e18 wei)
function parseXDC(amount: string): string {
  const [whole, dec = ''] = amount.split('.');
  const decimals = (dec + '0'.repeat(18)).slice(0, 18);
  const wei = BigInt(whole || '0') * BigInt('1000000000000000000') + BigInt(decimals);
  return wei.toString();
}

function isValidAddress(addr: string): boolean {
  // XDC addresses use xdc prefix OR 0x prefix
  const normalized = addr.startsWith('xdc') ? '0x' + addr.slice(3) : addr;
  return /^0x[0-9a-fA-F]{40}$/.test(normalized);
}

function normalizeAddress(addr: string): string {
  if (addr.startsWith('xdc')) return '0x' + addr.slice(3);
  return addr;
}

type TxStatus =
  | { type: 'idle' }
  | { type: 'estimating' }
  | { type: 'estimated'; cost: string }
  | { type: 'sending' }
  | { type: 'success'; userOpHash: string }
  | { type: 'error'; message: string };

export default function SendXDC() {
  const { kit, walletAddress, isReady, error: kitError } = useTransactionKit();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txName] = useState('xdc-transfer'); // internal name, not shown
  const [status, setStatus] = useState<TxStatus>({ type: 'idle' });

  // ── Validate inputs ──────────────────────────────────────────────────────
  const recipientError =
    recipient && !isValidAddress(recipient) ? 'Invalid XDC or 0x address' : '';
  const amountError =
    amount && (isNaN(Number(amount)) || Number(amount) <= 0)
      ? 'Enter a positive number'
      : '';
  const canProceed =
    isReady &&
    !!kit &&
    recipient &&
    !recipientError &&
    amount &&
    !amountError;

  // ── Estimate ─────────────────────────────────────────────────────────────
  const handleEstimate = async () => {
    if (!kit || !canProceed) return;
    console.log('kit state before estimate:', kit.getState());
    console.log('kit provider:', (kit as any).getProvider?.());
    setStatus({ type: 'estimating' });

    try {
      // Clean up any previous transaction with this name
      try {
        (kit.name({ transactionName: txName }) as any).remove();
      } catch {
        // No previous transaction — that's fine
      }

      kit.transaction({
        to: normalizeAddress(recipient),
        value: parseXDC(amount),
        chainId: 51,
      });
      kit.name({ transactionName: txName });

      const named = kit.name({ transactionName: txName }) as any;
      const result = await named.estimate();

      if (!result.isEstimatedSuccessfully) {
        setStatus({ type: 'error', message: result.errorMessage ?? 'Estimation failed' });
        return;
      }

      // Format cost from wei to XDC (5 decimal places)
      const costWei = result.cost ?? BigInt(0);
      const costXDC = (Number(costWei) / 1e18).toFixed(6);
      setStatus({ type: 'estimated', cost: costXDC });
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Estimation failed',
      });
    }
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!kit) return;
    setStatus({ type: 'sending' });

    try {
      const named = kit.name({ transactionName: txName }) as any;
      const result = await named.send();

      if (!result.isSentSuccessfully) {
        setStatus({ type: 'error', message: result.errorMessage ?? 'Send failed' });
        return;
      }

      setStatus({ type: 'success', userOpHash: result.userOpHash ?? '' });
      // Reset form
      setRecipient('');
      setAmount('');
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Send failed',
      });
    }
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (kit) kit.reset();
    setStatus({ type: 'idle' });
    setRecipient('');
    setAmount('');
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md mt-6">
      {/* Card */}
      <div className="bg-linear-to-br from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-7 shadow-[0_0_40px_rgba(99,102,241,0.15)] font-mono">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-xl">⬡</span>
            <h2 className="text-indigo-100 font-bold text-lg m-0 tracking-tight">
              Send XDC
            </h2>
            <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-400 py-0.5 px-2 rounded-full tracking-wider uppercase">
              Apothem Testnet
            </span>
          </div>

          {/* Smart account address */}
          {isReady && walletAddress ? (
            <p className="text-indigo-500 text-[11px] m-0 tracking-wide">
              Smart account:{' '}
              <span className="text-indigo-300">
                {walletAddress.slice(0, 8)}…{walletAddress.slice(-6)}
              </span>
            </p>
          ) : kitError ? (
            <p className="text-red-400 text-[11px] m-0">
              ⚠ Kit error: {kitError}
            </p>
          ) : (
            <p className="text-slate-500 text-[11px] m-0">
              Initializing smart account…
            </p>
          )}
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">

          {/* Recipient */}
          <div>
            <label className="text-slate-400 text-[11px] tracking-widest uppercase block mb-1.5">
              Recipient Address
            </label>
            <input
              type="text"
              placeholder="0x… or xdc…"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              disabled={status.type === 'sending' || status.type === 'estimated'}
              className={`w-full bg-slate-900/80 border ${recipientError ? 'border-red-500' : 'border-indigo-500/25'
                } rounded-lg py-2.5 px-3 text-indigo-100 text-[13px] outline-none box-border`}
            />
            {recipientError && (
              <p className="text-red-400 text-[11px] mt-1 mb-0">
                {recipientError}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-slate-400 text-[11px] tracking-widest uppercase block mb-1.5">
              Amount (XDC)
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={status.type === 'sending' || status.type === 'estimated'}
                min="0"
                step="any"
                className={`w-full bg-slate-900/80 border ${amountError ? 'border-red-500' : 'border-indigo-500/25'
                  } rounded-lg py-2.5 pl-3 pr-12 text-indigo-100 text-[13px] outline-none box-border`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 text-xs font-semibold">
                XDC
              </span>
            </div>
            {amountError && (
              <p className="text-red-400 text-[11px] mt-1 mb-0">
                {amountError}
              </p>
            )}
          </div>

          {/* Gas estimate display */}
          {status.type === 'estimated' && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 flex justify-between items-center">
              <span className="text-slate-400 text-xs">Estimated gas fee</span>
              <span className="text-indigo-300 text-[13px] font-semibold">
                ~{status.cost} XDC
              </span>
            </div>
          )}

          {/* Error display */}
          {status.type === 'error' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-300 text-xs m-0">
                ✗ {status.message}
              </p>
            </div>
          )}

          {/* Success display */}
          {status.type === 'success' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-green-300 text-xs mb-1.5 mt-0">
                ✓ Transaction sent successfully!
              </p>
              <p className="text-green-400 text-[10px] m-0 break-all">
                UserOp: {status.userOpHash}
              </p>
            </div>
          )}

          {/* Buttons */}
          {status.type === 'idle' || status.type === 'error' ? (
            <button
              onClick={handleEstimate}
              disabled={!canProceed}
              className={`w-full rounded-lg p-3 text-[13px] font-semibold tracking-wider transition-opacity ${canProceed
                  ? 'bg-linear-to-br from-indigo-500 to-indigo-600 text-white cursor-pointer'
                  : 'bg-indigo-500/20 text-indigo-500 cursor-not-allowed'
                }`}
            >
              Estimate Gas
            </button>
          ) : status.type === 'estimating' ? (
            <button
              disabled
              className="w-full bg-indigo-500/20 text-indigo-400 rounded-lg p-3 text-[13px] cursor-not-allowed"
            >
              Estimating…
            </button>
          ) : status.type === 'estimated' ? (
            <div className="flex gap-2.5">
              <button
                onClick={handleReset}
                className="flex-1 bg-transparent text-slate-400 border border-slate-400/20 rounded-lg p-3 text-[13px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                className="flex-2 bg-linear-to-br from-green-500 to-green-600 text-white border-none rounded-lg p-3 text-[13px] font-semibold cursor-pointer tracking-wider"
              >
                Confirm & Send
              </button>
            </div>
          ) : status.type === 'sending' ? (
            <button
              disabled
              className="w-full bg-green-500/20 text-green-400 rounded-lg p-3 text-[13px] cursor-not-allowed"
            >
              Sending…
            </button>
          ) : status.type === 'success' ? (
            <button
              onClick={handleReset}
              className="w-full bg-linear-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-3 text-[13px] font-semibold cursor-pointer tracking-wider"
            >
              Send Another
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}