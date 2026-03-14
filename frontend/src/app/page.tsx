'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Auth from '../components/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch('http://localhost:5000/auth/me', {
        credentials: 'include',
      });

      if (res.ok) {
        router.push('/successPage'); // already logged in
        return;
      }

      // Access token expired, try refresh
      if (res.status === 401) {
        const refreshRes = await fetch('http://localhost:5000/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          router.push('/successPage');
        }
        // If refresh also fails, stay on login page
      }
    };

    checkSession();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-md flex-col items-center justify-center py-12 px-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col items-center gap-4 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            Welcome to the dApp
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Log in to securely access your decentralized wallet and session metadata.
          </p>
        </div>
        <div className="w-full">
          <Auth />
        </div>
      </main>
    </div>
  );
}