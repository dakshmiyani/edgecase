import React, { useState, useEffect } from 'react';
import { usePolicyStore } from '../../store/policyStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Settings2, Plus, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function RuleManager() {
  const { rules, fetchRules, saveRule, deleteRule, isLoading } = usePolicyStore();
  const [editingRule, setEditingRule] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleToggleActive = async (rule) => {
    await saveRule({ ...rule, is_active: !rule.is_active });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      ...editingRule,
      name: formData.get('name'),
      priority: parseInt(formData.get('priority')),
      action: formData.get('action'),
      condition: JSON.parse(formData.get('condition')),
    };
    
    try {
      await saveRule(payload);
      setEditingRule(null);
      setIsAdding(false);
    } catch (err) {
      alert(`Invalid rule: ${err.message}`);
    }
  };

  const ActionBadge = ({ action }) => {
    const colors = {
      BLOCK: 'destructive',
      OTP: 'secondary',
      ALLOW: 'success'
    };
    return <Badge variant={colors[action]}>{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-violet-400" />
          Policy Engine
        </h2>
        <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {(isAdding || editingRule) && (
        <Card className="border-violet-500/30 bg-violet-500/[0.02]">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {isAdding ? 'Create New Rule' : `Edit Rule: ${editingRule.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 uppercase font-mono">Rule Name</label>
                  <Input name="name" defaultValue={editingRule?.name} required placeholder="SCORE_HIGH_RISK" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/40 uppercase font-mono">Priority (1-100)</label>
                  <Input name="priority" type="number" defaultValue={editingRule?.priority || 10} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 uppercase font-mono">Action outcome</label>
                <select 
                  name="action" 
                  defaultValue={editingRule?.action || 'OTP'}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
                >
                  <option value="ALLOW">ALLOW</option>
                  <option value="OTP">OTP</option>
                  <option value="BLOCK">BLOCK</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40 uppercase font-mono">Conditions (JSON Logic)</label>
                <textarea 
                  name="condition"
                  defaultValue={editingRule ? JSON.stringify(editingRule.condition, null, 2) : '{\n  "all": []\n}'}
                  rows={6}
                  className="w-full bg-[#0d0721] border border-white/[0.06] rounded-xl px-4 py-3 text-xs font-mono text-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => { setEditingRule(null); setIsAdding(false); }}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                  <Save className="w-4 h-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {rules.map((rule) => (
          <div 
            key={rule.rule_id}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
              rule.is_active 
                ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]' 
                : 'bg-black/20 border-white/[0.03] opacity-60 grayscale'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.05]">
                <span className="text-[10px] text-white/30 font-mono">PRIO</span>
                <span className="text-xs font-bold font-mono text-violet-400">{rule.priority}</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">{rule.name}</h3>
                <div className="flex items-center gap-2">
                  <ActionBadge action={rule.action} />
                  <span className="text-[10px] text-white/20 font-mono italic">
                    Updated {new Date(rule.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleToggleActive(rule)}
                className={`h-8 px-3 rounded-lg text-[10px] transition-colors ${
                  rule.is_active ? 'text-green-400 hover:text-green-300' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-violet-400" onClick={() => setEditingRule(rule)}>
                <Settings2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-red-400" onClick={() => deleteRule(rule.rule_id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
