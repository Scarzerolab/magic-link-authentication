import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { useMagic } from '../providers/MagicProvider';

const useEthers = () => {
  const { magic } = useMagic();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);

  useEffect(() => {
    if (magic) {
      // Wrap Magic's RPC provider with Ethers.js v5 Web3Provider
      const ethersProvider = new ethers.providers.Web3Provider((magic as any).rpcProvider);
      setProvider(ethersProvider);
    } else {
      console.log('User is not authenticated');
    }
  }, [magic]);
  
  return provider;
};

export default useEthers;