'use client';

import { useEffect, useState } from 'react';
import { useMagic } from '@/src/providers/MagicProvider';
import WalletDisplay from '@/src/components/walletDisplay';
import MetadataDisplay from '@/src/components/metadataDisplay';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/src/lib/fetchWithAuth';
import GaslessTest from '@/src/components/GaslessTest';

export default function SuccessPage() {
  const { magic } = useMagic();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  // Protect the route — redirect if no valid session
  useEffect(() => {
    fetchWithAuth('http://localhost:5000/auth/me')
      .then(res => {
        if (res.ok) {
          setAuthorized(true);
        } else {
          router.push('/');
        }
      });
  }, []);

  const handleLogout = async () => {
    // Log out of Magic
    if (magic) await magic.user.logout();

    // Delete refresh token from Redis + clear cookies
    await fetch('http://localhost:5000/auth/logout', {
      method: 'DELETE',
      credentials: 'include',
    });

    router.push('/');
  };

  if (!authorized) return null; // prevent flash of protected content

  return (
    <main className="p-10 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Login Successful! 🎉</h1>
      <button onClick={handleLogout} className="text-red-500 underline">
        Log Out
      </button>
      <WalletDisplay />
      <MetadataDisplay />
      <GaslessTest />
    </main>
  );
}