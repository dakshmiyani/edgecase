import React, { useState } from 'react';
import { useMerchantStore } from '../../store/merchantStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Link2, Loader2, CheckCircle2 } from 'lucide-react';

export default function MerchantMap() {
  const [merchantUserId, setMerchantUserId] = useState('');
  const [userTokenId, setUserTokenId] = useState('');
  const [success, setSuccess] = useState(null);
  const { mapToken, isLoading, error } = useMerchantStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await mapToken(merchantUserId, userTokenId);
      setSuccess(result);
      setMerchantUserId('');
      setUserTokenId('');
    } catch {
      // Error in store
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="w-4 h-4 text-cyan-400" />
          Map Token
        </CardTitle>
        <CardDescription>Link your internal user ID to a SecureAiPay token</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Mapped to {success.user_token_id}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Your Internal User ID
            </label>
            <Input
              placeholder="e.g., customer_12345"
              value={merchantUserId}
              onChange={(e) => setMerchantUserId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
              User Token ID
            </label>
            <Input
              placeholder="e.g., usr_abc123"
              value={userTokenId}
              onChange={(e) => setUserTokenId(e.target.value)}
              required
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" variant="glow" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Map Token'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
