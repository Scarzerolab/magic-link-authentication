// hooks/useGaslessTransaction.ts
import { useCallback, useEffect, useState } from 'react';
import { useMagic } from '../providers/MagicProvider';
import { createWalletClient, custom, parseEther, isAddress } from 'viem';
import { xdcTestnet } from 'viem/chains';
import { EtherspotBundler, ModularSdk } from '@etherspot/modular-sdk';

const CHAIN_ID = 51;
const ARKA_API_KEY = 'etherspot_public_key';
const BUNDLER_API_KEY = process.env.NEXT_PUBLIC_ETHERSPOT_API_KEY!;

// define locally, safer in browser
const sleep = (sec: number) => new Promise(resolve => setTimeout(resolve, sec * 1000));

export type TxStatus = 'idle' | 'building' | 'estimating' | 'sending' | 'confirming' | 'done' | 'error';

export function useGaslessTransaction() {
    const { magic } = useMagic();
    const [modularSdk, setModularSdk] = useState<ModularSdk | null>(null);
    const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null);
    const [status, setStatus] = useState<TxStatus>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // init SDK once when magic is ready
    useEffect(() => {
        if (!magic) return;

        const init = async () => {
            try {
                const walletClient = createWalletClient({
                    transport: custom((magic as any).rpcProvider),
                    chain: xdcTestnet
                })

                const [address] = await walletClient.getAddresses()

                const walletClientWithAccount = createWalletClient({
                    account: address,
                    transport: custom((magic as any).rpcProvider),
                    chain: xdcTestnet
                })

                const sdk = new ModularSdk(walletClientWithAccount, {
                    chainId: CHAIN_ID,
                    bundlerProvider: new EtherspotBundler(
                        CHAIN_ID,
                        BUNDLER_API_KEY,
                        'https://testnet-rpc.etherspot.io/v2/51'
                    )
                })

                const smartWallet = await sdk.getCounterFactualAddress()
                console.log('EOA (Magic):', address)
                console.log('Smart wallet:', smartWallet)

                setModularSdk(sdk)
                setSmartWalletAddress(smartWallet)
            } catch (err) {
                console.error('SDK init failed:', err)
            }
        }

        init()
    }, [magic])

    const sendGasless = useCallback(async (to: string, valueEth: string) => {
        // validation
        if (!modularSdk) {
            setError('SDK not initialized yet')
            return
        }
        if (!isAddress(to)) {
            setError('Invalid recipient address')
            return
        }
        if (!valueEth || parseFloat(valueEth) <= 0) {
            setError('Invalid amount')
            return
        }

        setStatus('building');
        setError(null);
        setTxHash(null);

        try {
            await modularSdk.clearUserOpsFromBatch();
            await modularSdk.addUserOpsToBatch({
                to,
                value: parseEther(valueEth),
            });

            setStatus('estimating');

            const op = await modularSdk.estimate({
                paymasterDetails: {
                    url: `https://arka.etherspot.io?apiKey=${ARKA_API_KEY}&chainId=${CHAIN_ID}`,
                    context: { mode: 'sponsor' },
                },
            });

            setStatus('sending');

            const uoHash = await modularSdk.send(op);
            console.log('UserOpHash:', uoHash);
            setStatus('confirming');

            let receipt: any = null;
            const timeout = Date.now() + 60000;
            while (!receipt && Date.now() < timeout) {
                await sleep(2);
                receipt = await modularSdk.getUserOpReceipt(uoHash);
            }

            if (!receipt) throw new Error('Transaction timed out after 60s');

            const hash = receipt?.receipt?.transactionHash 
                ?? receipt?.transactionHash 
                ?? uoHash;
                
            setTxHash(hash);
            setStatus('done');

        } catch (err: any) {
            console.error('Gasless tx error:', err);
            setError(err?.message ?? 'Transaction failed');
            setStatus('error');
        }
    }, [modularSdk]);

    return { 
        sendGasless, 
        status, 
        txHash, 
        error,
        smartWalletAddress  // expose this so UI can show it
    };
}