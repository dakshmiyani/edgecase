import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { KeyRound, Loader2, RefreshCw } from 'lucide-react';
import DeviceBanner from './DeviceBanner';

export default function OTPVerify() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { user, verifyOTP, sendOTP, isLoading, error, clearError, deviceRecognized } = useAuthStore();

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    clearError();

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((d) => d) && newOtp.join('').length === 6) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpString) => {
    if (!user?.user_token_id) return;
    try {
      await verifyOTP(user.user_token_id, otpString);
      navigate('/dashboard');
    } catch {
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!user?.user_token_id) return;
    try {
      await sendOTP(user.user_token_id);
      setCountdown(300);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      // Error handled by store
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-3">
          <KeyRound className="w-7 h-7 text-violet-400" />
        </div>
        <CardTitle className="text-2xl">Verify OTP</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to your device
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!deviceRecognized && <DeviceBanner />}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300 text-center">
            {error}
          </div>
        )}

        {/* OTP Input Grid */}
        <div className="flex justify-center gap-3" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200
                ${digit
                  ? 'bg-violet-500/10 border-violet-500/30 text-white'
                  : 'bg-white/[0.03] border-white/10 text-white/60'
                }
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
              `}
              id={`otp-input-${index}`}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Countdown */}
        <div className="text-center">
          {countdown > 0 ? (
            <p className="text-sm text-white/40">
              Code expires in <span className="text-violet-400 font-mono">{formatTime(countdown)}</span>
            </p>
          ) : (
            <p className="text-sm text-amber-400">Code expired</p>
          )}
        </div>

        {/* Verify Button */}
        <Button
          variant="glow"
          className="w-full"
          disabled={isLoading || otp.some((d) => !d)}
          onClick={() => handleVerify(otp.join(''))}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
          ) : (
            'Verify Code'
          )}
        </Button>

        {/* Resend */}
        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={isLoading || countdown > 270}
            className="text-xs text-white/30 hover:text-violet-400 transition-colors inline-flex items-center gap-1 disabled:opacity-30"
          >
            <RefreshCw className="w-3 h-3" />
            Resend Code
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
