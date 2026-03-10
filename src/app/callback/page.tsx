'use client';

import { useEffect } from 'react';
import { useMagic } from '@/src/providers/MagicProvider';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const { magic } = useMagic();
  const router = useRouter();

  useEffect(() => {
    if (!magic) return;

    const finishLogin = async () => {
      try {
        await magic.oauth2.getRedirectResult();
        
        // LOGIN SUCCESS! Now send them to the success page
        router.push('/successPage'); 

      } catch (error) {
        console.error("Error during redirect:", error);
        router.push('/'); // If it fails, send them back home
      }
    };

    finishLogin();
  }, [magic, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Processing secure login...</p>
    </div>
  );
}