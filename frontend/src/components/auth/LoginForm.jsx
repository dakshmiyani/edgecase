import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import OTPVerify from './OTPVerify';

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('');
  const navigate = useNavigate();
  const { sendOTP, isLoading, error, clearError, otpSent } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      await sendOTP(identifier);
    } catch {
      // Error handled by store
    }
  };

  // Show OTP verify after sending
  if (otpSent) {
    return <OTPVerify />;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-3">
          <LogIn className="w-7 h-7 text-violet-400" />
        </div>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>Enter your email or phone to receive a verification code</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Email or Phone
            </label>
            <Input
              id="login-identifier"
              type="text"
              placeholder="you@example.com or +1234567890"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>
        </CardContent>

        <CardFooter className="flex-col gap-4">
          <Button type="submit" variant="glow" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
            ) : (
              'Send Verification Code'
            )}
          </Button>
          <p className="text-xs text-white/30 text-center">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-violet-400 hover:underline">
              Register here
            </button>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
