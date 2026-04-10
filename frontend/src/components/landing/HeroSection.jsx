import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const HeroSection = () => {
  const containerRef = useRef(null);
  const leftContentRef = useRef(null);
  const rightContentRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useGSAP(() => {
    const tl = gsap.timeline();

    // Left side entrance
    tl.from('.hero-badge', { opacity: 0, y: 15, duration: 0.8, ease: 'power2.out', delay: 0.3 })
      .from('.hero-h1-line', { opacity: 0, y: 50, duration: 1, stagger: 0.15, ease: 'power4.out' }, '-=0.6')
      .from('.hero-sub', { opacity: 0, y: 15, duration: 0.8, ease: 'power2.out' }, '-=0.7')
      .from('.hero-cta-btn', { opacity: 0, y: 15, duration: 0.8, stagger: 0.1, ease: 'power2.out' }, '-=0.6')
      .from('.hero-stat-item', { opacity: 0, y: 10, duration: 1, stagger: 0.08, ease: 'power1.out' }, '-=0.6');

    // Right side entrance
    tl.from('.glass-panel-3d', { opacity: 0, scale: 0.9, x: 40, duration: 1.5, ease: 'power3.out' }, '-=1.2');

    // Subtle Floating Animation for Right Panel
    gsap.to('.glass-panel-3d', {
      y: '+=15',
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      className="relative w-screen min-h-screen overflow-hidden flex items-center px-8 md:px-16 lg:px-24 py-24"
    >
      {/* 
         BACKGROUND LAYER (Preserved)
      */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <img 
          src="/images/herobg.webp" 
          alt="Hero Background" 
          className="w-full h-full object-cover opacity-60 scale-105"
        />
      </div>

      <div className="absolute inset-0 pointer-events-none z-[1]">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#04020f] via-[#04020f]/80 to-transparent" />
      </div>

      {/* 
         SPLIT LAYOUT (60/40)
      */}
      <div className="relative z-[10] w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-10 gap-16 items-center">
        
        {/* LEFT SIDE (60%) */}
        <div ref={leftContentRef} className="lg:col-span-6 flex flex-col items-start text-left">
          {/* Badge */}
          <div className="hero-badge mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="font-mono text-[10px] text-white/50 tracking-[0.2em] uppercase">
                AI-Native Payment Security
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="font-syne font-black text-[clamp(44px,7.5vw,100px)] leading-[0.88] text-white uppercase tracking-tighter mb-8 max-w-3xl">
            <div className="hero-h1-line overflow-hidden">Every Payment.</div>
            <div className="hero-h1-line overflow-hidden">Intelligent.</div>
            <div className="hero-h1-line overflow-hidden">Secured.</div>
          </h1>

          {/* Subtext */}
          <p className="hero-sub font-inter font-light text-[17px] md:text-[19px] leading-relaxed text-white/50 max-w-[540px] mb-12">
            The AI layer that thinks before every transaction. Real-time fraud detection with near-zero false positives.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-5 mb-16">
            <button 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              className="hero-cta-btn mag-btn relative px-10 py-5 rounded-xl bg-white text-black font-syne font-extrabold text-sm uppercase tracking-tight hover:bg-neutral-200 transition-colors"
            >
              Enter the System →
            </button>
            <button 
              onClick={() => navigate('/audit')}
              className="hero-cta-btn mag-btn px-10 py-5 rounded-xl border border-white/10 text-white font-syne font-bold text-sm uppercase tracking-tight hover:bg-white/5 transition-colors"
            >
              See Live Demo
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-start gap-x-12 gap-y-8 pt-8 border-t border-white/5 w-full">
            {[
              { label: "Fraud Detection", val: "99.97%" },
              { label: "Decision Speed", val: "<12ms" },
              { label: "Protected Volume", val: "$4.2B" },
              { label: "False Positives", val: "0.001%" }
            ].map((s, i) => (
              <div key={i} className="hero-stat-item flex flex-col gap-1.5">
                <span className="font-syne font-bold text-xl text-white tracking-tight leading-none">{s.val}</span>
                <span className="font-inter text-[9px] text-white/20 uppercase tracking-[0.14em] leading-none">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE (40%) */}
        <div ref={rightContentRef} className="lg:col-span-4 flex items-center justify-center lg:justify-end">
          {/* Elegant Single Glass Panel */}
          <div className="glass-panel-3d relative w-full max-w-[380px] p-8 rounded-[32px] glass backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group overflow-hidden">
             {/* Subtle Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-colors duration-1000" />
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_12px_#22c55e]" />
              <span className="font-mono text-[10px] text-white/40 tracking-widest uppercase">System Active</span>
            </div>

            {/* Middle Content */}
            <div className="space-y-1 mb-10">
              <div className="font-inter text-xs text-white/40 mb-2">Fraud Check: <span className="text-green-400 font-medium">Approved</span></div>
              <div className="font-syne font-extrabold text-[44px] text-white leading-none tracking-tight">$12,450.00</div>
              <div className="flex items-baseline gap-2 pt-2">
                 <span className="font-inter text-[13px] text-white/60">Risk Score:</span>
                 <span className="font-syne font-bold text-[13px] text-green-400">0.18 (Low)</span>
              </div>
            </div>

            {/* Bottom Progress */}
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-gradient-to-r from-green-400 to-cyan-400 w-[18%]" />
            </div>
          </div>
        </div>

      </div>

      {/* SCROLL INDICATOR */}
      <div className="absolute bottom-10 left-8 md:left-16 lg:left-24 flex items-center gap-5 z-[10] opacity-20">
         <div className="w-8 h-[1px] bg-white" />
         <span className="font-mono text-[9px] text-white tracking-[0.2em] uppercase">Scroll</span>
      </div>
    </section>
  );
};

export default HeroSection;
