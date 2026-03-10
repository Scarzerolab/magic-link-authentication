'use client';

import { useEffect, useState } from 'react';
import { useMagic } from '../providers/MagicProvider';

export default function MetadataDisplay() {
  const { magic } = useMagic();
  
  const [metadata, setMetadata] = useState<any>(null);
  const [didToken, setDidToken] = useState<string>('');

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!magic) return;

      try {
        const userInfo = await magic.user.getInfo();
        setMetadata(userInfo);

        const token = await magic.user.getIdToken();
        setDidToken(token);
        
      } catch (error) {
        console.error("Error fetching Magic metadata:", error);
      }
    };

    fetchMetadata();
  }, [magic]);

  if (!metadata) return <p className="mt-4">Loading metadata...</p>;

  return (
    <div className="p-6 border rounded-lg max-w-2xl mt-4 w-full wrap-break-word">
      <h2 className="text-xl font-bold mb-4">Magic Session Metadata</h2>
      
      <div className="mb-2">
        <span className="font-semibold">Email: </span> 
        {/* If logging in with certain OAuth providers, email might be null */}
        {metadata.email ? metadata.email : <span className="italic text-gray-500">Not provided by OAuth</span>}
      </div>
      
      <div className="mb-2">
        <span className="font-semibold">Issuer (DID): </span> 
        <p className="text-sm text-gray-600 font-mono mt-1">{metadata.issuer}</p>
      </div>
      
      <div className="mt-4">
        <span className="font-semibold">Active DID Token: </span>
        <div className="bg-gray-100 p-3 rounded text-xs font-mono text-gray-800 mt-2 max-h-32 overflow-y-auto">
          {didToken}
        </div>
      </div>
    </div>
  );
}