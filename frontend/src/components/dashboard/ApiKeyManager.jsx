import React, { useEffect, useState } from 'react';
import { useApiKeyStore } from '../../store/apiKeyStore';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Key, Plus, Trash2, Clock, Copy, Check, 
  AlertCircle, ShieldCheck, Loader2, Eye, EyeOff 
} from 'lucide-react';

export default function ApiKeyManager() {
  const { keys, isLoading, error, newKey, fetchKeys, createKey, revokeKey, clearNewKey } = useApiKeyStore();
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createKey(name);
      setName('');
      setShowModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    if (newKey?.rawKey) {
      navigator.clipboard.writeText(newKey.rawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onCloseModal = () => {
    setShowModal(false);
    clearNewKey();
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Form */}
      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider">
            Create New API Key
          </label>
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input 
              placeholder="e.g. Production Mobile App" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10"
            />
            <Button type="submit" disabled={isLoading || !name.trim()} className="bg-violet-600 hover:bg-violet-500">
              <Plus className="w-4 h-4 mr-2" /> Generate Key
            </Button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Key List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white/60">Your API Keys</h3>
        {isLoading && keys.length === 0 ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
            <Key className="w-12 h-12 mx-auto mb-4 text-white/10" />
            <p className="text-white/40 text-sm">No API keys generated yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {keys.map((key) => (
              <Card key={key.id} className="border-white/10 bg-white/5">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{key.name}</h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs font-mono text-white/40">{key.key_prefix}...</span>
                        <span className="flex items-center gap-1.5 text-[10px] text-white/20">
                          <Clock className="w-3 h-3" />
                          Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => revokeKey(key.id)}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Show Once Modal */}
      {showModal && newKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="max-w-md w-full border-violet-500/30 bg-[#0a0a0f] shadow-2xl">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">API Key Generated</h3>
                <p className="text-sm text-white/40 mt-1">
                  Copy this key now. For security, we won't show it again.
                </p>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 font-mono text-sm break-all relative group">
                <span className="text-violet-400">{newKey.rawKey}</span>
                <button 
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-1.5 bg-black/40 rounded-lg hover:bg-black/60 transition-all border border-white/10"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
                </button>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-400 leading-relaxed font-medium">
                  WARNING: This is a secret key. Treat it like a password. 
                  Do not share it or commit it to version control.
                </p>
              </div>

              <Button onClick={onCloseModal} className="w-full bg-violet-600 hover:bg-violet-500">
                I've Saved It
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
