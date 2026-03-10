'use client';

import { useMagic } from '@/src/providers/MagicProvider';
import WalletDisplay from '@/src/components/walletDisplay';
import MetadataDisplay from '@/src/components/metadataDisplay';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const { magic } = useMagic();
  const router = useRouter();

  const handleLogout = async () => {
    if (!magic) return;
    await magic.user.logout();
    router.push('/'); 
  };

  return (
    <main className="p-10 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Login Successful! 🎉</h1>
      
      <button onClick={handleLogout} className="text-red-500 underline">
        Log Out
      </button>

      <WalletDisplay />
      <MetadataDisplay />
    </main>
  );
}