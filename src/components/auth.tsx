'use client';

import { useState } from "react";
import { useMagic } from "../providers/MagicProvider";
import { useRouter } from "next/navigation";

export default function Auth() {
  const { magic } = useMagic();
  const router = useRouter();

  // State to handle our custom inputs and UI steps
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  
  // We need to store the Magic "event listener" so we can talk to it in Step 2
  const [magicHandle, setMagicHandle] = useState<any>(null);
  const [error, setError] = useState('');

  // --- STEP 1: Submit the Email ---
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magic) return;

    try {
      setError('');
      
      // 1. Start the login, but explicitly tell Magic to hide its UI
      const handle = magic.auth.loginWithEmailOTP({ 
        email, 
        showUI: false 
      });

      // 2. Save this background process to our React state
      setMagicHandle(handle);

      // 3. Listen for Magic to tell us the email actually sent successfully
      handle.on('email-otp-sent', () => {
        setStep('OTP'); // Swap the UI to show the OTP input!
      });

      // 4. Listen for an incorrect code
      handle.on('invalid-email-otp', () => {
        setError('Invalid code. Please check your email and try again.');
      });

      // 5. When the whole process finishes successfully
      handle.then((didToken: string | null) => {
        if (!didToken) return console.log('missing did token');
        console.log('Login successful!', didToken);
        router.push('/successPage'); // Send them to the dashboard
      });

      handle.catch((err: any) => {
        console.error("Magic Login Error:", err);
        setError('An error occurred. Please try again.');
      });

    } catch (err) {
      console.error(err);
    }
  };

  // --- STEP 2: Submit the OTP ---
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicHandle) return;
    
    // Send the 6-digit code the user typed back to the hidden Magic process
    magicHandle.emit('verify-email-otp', otp);
  };

  return (
    <div className="flex flex-col gap-4 p-6 border rounded-lg max-w-sm w-full bg-white dark:bg-zinc-900 shadow-sm">
      <h2 className="text-xl font-bold">Sign In</h2>
      
      {/* View 1: The Email Input */}
      {step === 'EMAIL' && (
        <form onSubmit={handleSendEmail} className="flex flex-col gap-3">
          <input 
            type="email" 
            placeholder="name@company.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-zinc-300 p-2 rounded text-white outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button type="submit" className="bg-blue-600 text-white font-semibold p-2 rounded hover:bg-blue-700 transition">
            Send Login Code
          </button>
        </form>
      )}

      {/* View 2: The OTP Input */}
      {step === 'OTP' && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            We sent a secure code to <span className="font-semibold">{email}</span>
          </p>
          <input 
            type="text" 
            placeholder="123456" 
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border border-zinc-300 p-2 rounded text-white text-center text-2xl tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={6}
            required
          />
          <button type="submit" className="bg-green-600 text-white font-semibold p-2 rounded hover:bg-green-700 transition">
            Verify & Secure Login
          </button>
        </form>
      )}

      {/* Error Messages */}
      {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
    </div>
  );
}