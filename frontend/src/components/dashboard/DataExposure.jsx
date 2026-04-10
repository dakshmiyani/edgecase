import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Database, ShieldOff, Users } from 'lucide-react';
import { usePrivacyStore } from '../../store/privacyStore';

export default function DataExposure({ fields = [] }) {
  const { revokeField } = usePrivacyStore();

  const handleRevoke = async (field) => {
    if (window.confirm(`Revoke all merchant access to ${field}?`)) {
      await revokeField(field);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Data Exposure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-4">No data exposure detected</p>
        ) : (
          fields.map((field, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-[11px]">
                  {field.field}
                </Badge>
                <div className="text-xs text-white/30">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {field.merchant_count} merchant{field.merchant_count !== 1 ? 's' : ''}
                  </div>
                  <span className="text-[10px]">
                    Last: {new Date(field.last_accessed).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={() => handleRevoke(field.field)}
              >
                <ShieldOff className="w-3.5 h-3.5 mr-1" />
                Revoke
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
