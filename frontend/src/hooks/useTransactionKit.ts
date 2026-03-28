'use client';

import { useEffect, useState, useRef } from 'react';
import { useMagic } from '../providers/MagicProvider';

// We import TransactionKit lazily to avoid SSR issues in Next.js
// Add this to package.json: "@etherspot/transaction-kit": "^2.1.4"
type KitType = ReturnType<typeof import('@etherspot/transaction-kit').TransactionKit>;

const CHAIN_ID = 51; // XDC Apothem
// const BUNDLER_URL = 'https://testnet-rpc.etherspot.io/v2/51';
const BUNDLER_API_KEY = process.env.NEXT_PUBLIC_ETHERSPOT_API_KEY;

export function useTransactionKit() {
  const { magic } = useMagic();
  const [kit, setKit] = useState<KitType | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kitRef = useRef<KitType | null>(null);

  useEffect(() => {
    if (!magic) return;

    let cancelled = false;

    const initKit = async () => {
      try {
        setError(null);
        setIsReady(false);

        console.log('Step 1: magic:', magic);

        // Dynamically import to avoid SSR issues with Next.js
        const { TransactionKit } = await import('@etherspot/transaction-kit');
        console.log('Step 2: TransactionKit imported');

        const { ethers } = await import('ethers');
        console.log('Step 3: ethers imported');

        const magicRpcProvider = (magic as any).rpcProvider;
        console.log('Step 4: rpcProvider:', magicRpcProvider);

        const provider = new ethers.providers.Web3Provider(magicRpcProvider);
        console.log('Step 5: wrapped provider:', provider);

        const instance = TransactionKit({
          provider: provider as any,
          chainId: CHAIN_ID,
          walletMode: 'modular',
          bundlerApiKey: BUNDLER_API_KEY,
        });
        console.log('Step 6: kit created');

        if (cancelled) return;

        // Cache ref so we can reset on unmount without stale closure
        kitRef.current = instance;
        setKit(instance);

        // Resolve the smart account address (Etherspot counterfactual address)
        const address = await instance.getWalletAddress(CHAIN_ID);
        if (!cancelled) {
          setWalletAddress(address ?? null);
          setIsReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useTransactionKit] init error:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize TransactionKit');
        }
      }
    };

    initKit();

    return () => {
      cancelled = true;
      // Clean up kit state on unmount / magic change
      if (kitRef.current) {
        kitRef.current.reset();
        kitRef.current = null;
      }
      setKit(null);
      setWalletAddress(null);
      setIsReady(false);
    };
  }, [magic]);

  return { kit, walletAddress, isReady, error };
}