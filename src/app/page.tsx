import Auth from "../components/auth";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-md flex-col items-center justify-center py-12 px-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
        
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
            Welcome to the dApp
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Log in to securely access your decentralized wallet and session metadata.
          </p>
        </div>

        {/* The Smart Authentication Component */}
        <div className="w-full">
          <Auth />
        </div>

      </main>
    </div>
  );
}