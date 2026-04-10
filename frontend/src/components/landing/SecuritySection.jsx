import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SecuritySection = () => {
  const [progress, setProgress] = useState(0);
  const [built, setBuilt] = useState(false);
  const containerRef = useRef(null);

  useGSAP(() => {
    // Shield animation trigger
    ScrollTrigger.create({
      trigger: '.shield-visual',
      start: 'top 62%',
      onEnter: () => {
        setBuilt(true);
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 1.5;
          });
        }, 18);
      }
    });

    // Badges staggered animation
    gsap.from('.compliance-badge', {
      scrollTrigger: {
        trigger: '.badges-grid',
        start: 'top 75%',
      },
      opacity: 0,
      scale: 0.82,
      stagger: 0.08,
      duration: 1,
      ease: 'back.out(1.7)',
    });
  }, { scope: containerRef });

  const badges = [
    { title: "AES-256-GCM", sub: "Data encryption" },
    { title: "TLS 1.3", sub: "Transport security" },
    { title: "PCI-DSS L1", sub: "Payment compliance" },
    { title: "SOC 2 Type II", sub: "Audit certified" },
    { title: "GDPR Ready", sub: "Privacy compliant" },
    { title: "ISO 27001", sub: "Info security mgmt" },
  ];

  const auditLogs = [
    { t: "14:23:01.003", e: "TXN-0x4f2a validated — ALLOWED", c: "#4ade80" },
    { t: "14:23:00.891", e: "Neural inference: 0.09ms", c: "#38bdf8" },
    { t: "14:22:59.441", e: "TXN-0x9c1b anomaly flagged", c: "#f87171" },
    { t: "14:22:58.120", e: "Identity verified: Elena K.", c: "#a78bfa" },
  ];

  return (
    <section ref={containerRef} id="security" className="relative py-32 px-6 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_60%_at_50%_50%,rgba(124,58,237,0.13)_0%,transparent_66%)]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* TOP — Header */}
        <div className="text-center mb-20">
          <div className="font-mono text-[11px] text-[#a78bfa] tracking-widest uppercase mb-4">
            SECURITY CORE
          </div>
          <h2 className="font-syne font-extrabold text-[clamp(40px,5.5vw,68px)] leading-[1.05] text-white">
            Encryption-First. <br />
            <span className="g-text">Privacy by Design.</span>
          </h2>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* LEFT — Shield visual */}
          <div className="shield-visual flex justify-center items-center relative">
            <div className="relative w-[300px] h-[300px] rounded-full flex items-center justify-center">
              
              {/* RING 3 (outermost) */}
              <div className={`absolute -inset-[44px] rounded-full border border-[#7c3aed]/15 anim-pulse-ring transition-opacity duration-1000 ${built ? 'opacity-100' : 'opacity-0'}`} 
                style={{ animation: 'pulse-ring 3.2s ease-in-out infinite' }}
              />
              
              {/* RING 2 */}
              <div className={`absolute -inset-[24px] rounded-full border border-[#06b6d4]/12 anim-pulse-ring transition-opacity duration-1000 ${built ? 'opacity-100' : 'opacity-0'}`} 
                style={{ animation: 'pulse-ring 3.2s ease-in-out infinite 0.6s' }}
              />

              {/* MAIN CIRCLE */}
              <div className="relative w-[300px] h-[300px] rounded-full glass glow-v border border-[#7c3aed]/25 flex items-center justify-center overflow-hidden">
                
                {/* SVG PROGRESS RING */}
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                  <circle 
                    cx="50" cy="50" r="44" fill="none" 
                    stroke="url(#pGrad)" strokeWidth="1.5" strokeLinecap="round"
                    strokeDasharray="276.46"
                    strokeDashoffset={276.46 * (1 - progress / 100)}
                    className="transition-[stroke-dashoffset] duration-80"
                  />
                  <defs>
                    <linearGradient id="pGrad" x1="1" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* INNER CONTENT */}
                <div className="relative z-10 text-center">
                  <span className="text-[52px] block mb-2">🛡️</span>
                  <div className="font-syne font-extrabold text-[32px] g-text leading-none">{Math.round(progress)}%</div>
                  <div className="font-mono text-[11px] text-white/35 mt-1 uppercase tracking-wider">Encrypted</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Specs + log */}
          <div className="flex flex-col gap-6">
            <div className="badges-grid grid grid-cols-2 gap-3">
              {badges.map((b, i) => (
                <div key={i} className="compliance-badge p-[18px_20px] rounded-[18px] glass border border-white/7 hover:border-[#7c3aed]/35 transition-all">
                  <h4 className="font-syne font-bold text-[14px] text-white">{b.title}</h4>
                  <p className="font-inter text-[12px] text-white/45 mt-1">{b.sub}</p>
                </div>
              ))}
            </div>

            {/* AUDIT LOG PANEL */}
            <div className="p-[24px_26px] rounded-[22px] glass border border-[#7c3aed]/12">
              <div className="font-mono text-[10px] text-[#a78bfa] mb-4 uppercase tracking-widest">REAL-TIME AUDIT TRAIL</div>
              <div className="flex flex-col gap-2">
                {auditLogs.map((log, i) => (
                  <div key={i} className="flex gap-4 py-1">
                    <span className="font-mono text-[11px] text-white/28 w-[100px] shrink-0">{log.t}</span>
                    <span className="font-mono text-[11px] leading-tight" style={{ color: log.c }}>{log.e}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
