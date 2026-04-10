import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Shield, Mail, Phone, CheckCircle2, Loader2, User, Store, ShieldCheck, Info } from 'lucide-react';

export default function RegistrationForm() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('user');
  const [isBootstrapped, setIsBootstrapped] = useState(true);
  const [success, setSuccess] = useState(null);
  const { register, isLoading, error, setError, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // We still check bootstrap for the GLOBAL system if needed, 
    // but now every user can technically register a BRAND.
    const checkBootstrap = async () => {
      try {
        const { data } = await api.get('/users/bootstrap-status');
        setIsBootstrapped(data.bootstrapped);
      } catch (err) {
        console.error('Failed to check bootstrap status');
      }
    };
    checkBootstrap();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    try {
      if (role === 'admin' && companyName) {
        // Multi-tenant Brand Registration
        const { data } = await api.post('/auth/register-brand', {
          email, phone, companyName
        });
        setSuccess(data);
      } else {
        const data = await register(email, phone, role);
        setSuccess(data);
      }
    } catch (err) {
      // Error handled by store or local
      if (err.response?.data?.error) setError(err.response.data.error);
    }
  };

  if (success) {
    const maskedToken = `usr_***${success.user_token_id.slice(-3)}`;
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Registration Successful</h3>
          <p className="text-white/50 text-sm mb-4">Your identity has been securely created</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10">
            <span className="text-xs text-white/40 font-mono">Registered as</span>
            <span className="text-sm font-mono text-violet-400 font-bold">{maskedToken}</span>
          </div>
          <div className="mt-6 space-y-2">
            <Button variant="glow" className="w-full" onClick={() => navigate('/login')}>
              Continue to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20 flex items-center justify-center mb-3">
          <Shield className="w-7 h-7 text-violet-400" />
        </div>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Your data is encrypted end-to-end. We never store raw PII.</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <Input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider flex items-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Phone
            </label>
            <Input
              id="register-phone"
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {role === 'admin' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-medium text-violet-400 uppercase tracking-wider flex items-center gap-2">
                <Store className="w-3.5 h-3.5" /> Company Name
              </label>
              <Input
                id="register-company"
                type="text"
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="border-violet-500/30 bg-violet-500/5 focus:ring-violet-500/50"
              />
              <p className="text-[10px] text-white/40 italic">
                You will be registerd as the primary administrator for this brand.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Account Type
              </label>
              {isBootstrapped && role === 'merchant' && (
                <span className="text-[10px] text-violet-400 font-medium flex items-center gap-1">
                  <Info className="w-3 h-3" /> Contact Admin for invite
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'user', label: 'User', icon: User, hidden: false },
                { id: 'merchant', label: 'Merchant', icon: Store, hidden: isBootstrapped },
                { id: 'admin', label: 'Admin', icon: ShieldCheck, hidden: false, labelOverride: 'Brand' },
              ].filter(r => !r.hidden).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${
                    role === r.id
                      ? 'bg-violet-600/20 border-violet-500/50 text-white ring-2 ring-violet-500/20'
                      : 'bg-white/[0.02] border-white/10 text-white/40 hover:bg-white/[0.04] hover:border-white/20'
                  }`}
                >
                  <r.icon className={`w-5 h-5 ${role === r.id ? 'text-violet-400' : 'text-white/20'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {r.labelOverride || r.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" variant="glow" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
            ) : (
              'Create Secure Identity'
            )}
          </Button>
        </CardFooter>
      </form>

      <div className="px-6 pb-6 text-center">
        <p className="text-xs text-white/30">
          Already registered?{' '}
          <button onClick={() => navigate('/login')} className="text-violet-400 hover:underline">
            Login here
          </button>
        </p>
      </div>
    </Card>
  );
}
