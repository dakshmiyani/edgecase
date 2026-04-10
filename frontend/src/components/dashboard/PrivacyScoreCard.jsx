import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/card';

export default function PrivacyScoreCard({ score = 0, exposure = 'LOW' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate score on mount
  useEffect(() => {
    let start = 0;
    const end = score;
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);

  // Color based on score
  const getColor = (s) => {
    if (s >= 80) return { ring: '#10b981', bg: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-400', label: 'Excellent' };
    if (s >= 50) return { ring: '#f59e0b', bg: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-400', label: 'Fair' };
    return { ring: '#ef4444', bg: 'from-red-500/20 to-red-500/5', text: 'text-red-400', label: 'At Risk' };
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const exposureColors = {
    LOW: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    HIGH: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <Card className={`bg-gradient-to-br ${colors.bg} border-white/[0.06]`}>
      <CardContent className="pt-6 flex flex-col items-center">
        {/* SVG Ring */}
        <div className="relative w-40 h-40 mb-4">
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            {/* Score ring */}
            <circle
              cx="60" cy="60" r="54"
              fill="none"
              stroke={colors.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${colors.ring}40)`,
              }}
            />
          </svg>
          {/* Score number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${colors.text} font-mono`}>
              {animatedScore}
            </span>
            <span className="text-xs text-white/30 mt-1">/ 100</span>
          </div>
        </div>

        {/* Label */}
        <p className={`text-sm font-medium ${colors.text} mb-3`}>{colors.label}</p>

        {/* Exposure badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${exposureColors[exposure]}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          Data exposure: {exposure}
        </div>
      </CardContent>
    </Card>
  );
}
