'use client';

import { useEffect, useState } from 'react';
import useEthers from '../hooks/useEthers';
import { ethers } from 'ethers';

export default function WalletDisplay() {
  const provider = useEthers();
  
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!provider) return;

      try {
        const signer = provider.getSigner();
        
        const userAddress = await signer.getAddress();
        setAddress(userAddress);
        
        const balanceInWei = await provider.getBalance(userAddress);
        setBalance(ethers.utils.formatEther(balanceInWei));
        
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      }
    };

    fetchWalletData();
  }, [provider]);

  if (!address) return <p>Loading wallet...</p>;

  return (
    <div className="p-6 border rounded-lg max-w-sm mt-4">
      <h2 className="text-xl font-bold">Your Wallet</h2>
      <p className="text-sm text-gray-500 truncate mt-2">Address: {address}</p>
      <p className="text-lg font-semibold mt-2">Balance: {balance} ETH</p>
    </div>
  );
}