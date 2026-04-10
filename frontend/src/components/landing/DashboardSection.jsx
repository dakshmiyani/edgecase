import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DashboardSection = () => {
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef(null);

  const chartData = [42, 67, 48, 78, 54, 88, 68, 94, 62, 86, 74, 100];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const confidenceData = [62, 80, 71, 90, 84, 95, 87, 93];

  useGSAP(() => {
    gsap.from('.dashboard-panel', {
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 72%',
        onEnter: () => setAnimated(true),
      },
      opacity: 0,
      y: 36,
      scale: 0.96,
      stagger: 0.14,
      duration: 1,
      ease: 'power3.out',
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative py-32 px-6 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_55%_at_72%_50%,rgba(124,58,237,0.11)_0%,transparent_66%)]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* TOP — Header */}
        <div className="text-center mb-16">
          <div className="font-mono text-[11px] text-[#a78bfa] tracking-widest uppercase mb-4">
            COMMAND CENTER
          </div>
          <h2 className="font-syne font-extrabold text-[clamp(40px,5.5vw,68px)] leading-[1.05] text-white">
            Total Visibility. <br />
            <span className="g-text">Zero Blind Spots.</span>
          </h2>
        </div>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 grid-rows-auto gap-4">
          
          {/* PANEL 1 — Main chart */}
          <div className="dashboard-panel lg:col-span-2 p-8 rounded-[28px] glass border border-white/7">
            <div className="flex justify-between items-start mb-7">
              <div>
                <h3 className="font-syne font-bold text-[17px] text-white">Fraud Prevention Rate</h3>
                <p className="font-inter text-[13px] text-white/45 mt-1">Last 12 months</p>
              </div>
              <div className="font-syne font-extrabold text-[28px] g-text">99.97%</div>
            </div>

            <div className="flex items-end gap-2 h-35">
              {chartData.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div 
                    className="w-full rounded-t-sm bg-gradient-to-t from-[#7c3aed] to-[#06b6d4] transition-all duration-900 ease-out" 
                    style={{ 
                      height: animated ? `${(val / 100) * 140}px` : '0px',
                      transitionDelay: `${i * 55}ms` 
                    }}
                  />
                  <span className="font-mono text-[9px] text-white/25 uppercase">{months[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PANEL 2 — Threats blocked */}
          <div className="dashboard-panel p-7 rounded-[28px] glass border border-white/7 flex flex-col justify-between">
            <div>
              <div className="font-mono text-[10px] text-white/30 mb-3 uppercase tracking-widest">THREATS BLOCKED TODAY</div>
              <div className="font-syne font-extrabold text-[44px] text-[#f87171]">24,891</div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-[7px] h-[7px] rounded-full bg-[#f87171] anim-breathe" />
                <span className="font-inter text-xs text-white/45">+12.4% vs yesterday</span>
              </div>
              <div className="font-inter text-[11px] text-white/30 mt-1.5">0 false negatives</div>
            </div>
          </div>

          {/* PANEL 3 — Transactions approved */}
          <div className="dashboard-panel p-7 rounded-[28px] glass border border-white/7">
            <div className="font-mono text-[10px] text-white/30 mb-3 uppercase tracking-widest">APPROVED TODAY</div>
            <div className="font-syne font-extrabold text-[44px] text-[#4ade80]">1.2M</div>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-[7px] h-[7px] rounded-full bg-[#4ade80]" />
              <span className="font-inter text-xs text-white/45">0.001% false positive rate</span>
            </div>
          </div>

          {/* PANEL 4 — Mini sparkline */}
          <div className="dashboard-panel p-7 rounded-[28px] glass border border-white/7">
            <div className="font-mono text-[10px] text-white/30 mb-3.5 uppercase tracking-widest">AI CONFIDENCE</div>
            <div className="flex items-end gap-1 h-[60px]">
              {confidenceData.map((val, i) => (
                <div 
                  key={i} 
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-[#7c3aed] to-[#38bdf8] transition-all duration-700 ease-out" 
                  style={{ height: animated ? `${(val / 100) * 60}px` : '0px', transitionDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
          </div>

          {/* PANEL 5 — Avg response */}
          <div className="dashboard-panel p-7 rounded-[28px] glass border border-white/7">
            <div className="font-mono text-[10px] text-white/30 mb-2 uppercase tracking-widest">AVG RESPONSE</div>
            <div className="font-syne font-extrabold text-[44px] g-text leading-tight">11.4ms</div>
            <div className="font-inter text-xs text-white/45 mt-1.5">Per AI decision</div>
            <div className="font-inter text-xs text-[#4ade80] mt-1">↓ 94% vs legacy</div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DashboardSection;
