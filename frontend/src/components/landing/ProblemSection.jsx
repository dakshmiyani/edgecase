import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ProblemSection = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    // Heading animation
    gsap.from('.problem-h2', {
      scrollTrigger: {
        trigger: '.problem-h2',
        start: 'top 78%',
      },
      y: 60,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });

    // Threat cards animation
    gsap.from('.threat-card', {
      scrollTrigger: {
        trigger: '.threat-feed',
        start: 'top 92%',
        toggleActions: 'play none none none',
      },
      x: -40,
      opacity: 0,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power2.out',
    });

    // Stats grid animation
    gsap.from('.stat-box', {
      scrollTrigger: {
        trigger: '.stats-grid',
        start: 'top 75%',
      },
      opacity: 0,
      scale: 0.88,
      stagger: 0.1,
      duration: 1,
      ease: 'back.out(1.7)',
    });
  }, { scope: containerRef });

  const threatData = [
    { id: 'TXN-0x8821', amount: '$234,000', loc: 'Lagos → London', risk: 0.97, status: 'FRAUD' },
    { id: 'TXN-0x4412', amount: '$12,450', loc: 'New York, USA', risk: 0.12, status: 'SAFE' },
    { id: 'TXN-0x9f3b', amount: '$1.2M', loc: 'Unknown Node', risk: 0.99, status: 'FRAUD' },
    { id: 'TXN-0x2c7a', amount: '$8,900', loc: 'Singapore', risk: 0.08, status: 'SAFE' },
  ];

  const statsData = [
    { val: '$485B', label: 'Lost to fraud annually', color: '#f87171' },
    { val: '340ms', label: 'Avg legacy decision time', color: '#fb923c' },
    { val: '23%', label: 'False positive rate (legacy)', color: '#fbbf24' },
    { val: '4.2B', label: 'Fraud attempts daily', color: '#f87171' },
  ];

  return (
    <section 
      ref={containerRef}
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_50%_50%,rgba(239,68,68,0.07)_0%,transparent_68%)]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* TOP — Section header */}
        <div className="text-center mb-20">
          <div className="font-mono text-[11px] text-[#f87171] tracking-[0.14em] uppercase mb-4">
            ⚠ THE PROBLEM
          </div>
          <h2 className="problem-h2 font-syne font-extrabold text-[clamp(40px,5.5vw,68px)] leading-[1.05] text-white">
            The Financial Web <br />
            <span className="text-[#f87171]">Is Under Attack</span>
          </h2>
          <p className="font-inter font-light text-[18px] text-white/55 max-w-[540px] mx-auto mt-5">
            $485 billion lost to payment fraud annually. Legacy rule-based systems making blind decisions in a pre-AI world.
          </p>
        </div>

        {/* CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* LEFT COLUMN — Live Threat Feed */}
          <div className="threat-feed">
            <div className="font-mono text-[10px] text-white/30 tracking-widest uppercase mb-5">
              LIVE THREAT FEED
            </div>
            <div className="flex flex-col gap-3">
              {threatData.map((threat) => (
                <div 
                  key={threat.id}
                  style={{ opacity: 1 }}
                  className="threat-card w-full p-[18px_20px] rounded-[20px] glass flex items-center justify-between transition-all border border-white/10"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-white/40">{threat.id}</span>
                    <span className="font-syne font-bold text-[16px] text-white mt-[3px]">{threat.amount}</span>
                    <span className="font-inter text-[12px] text-white/45 mt-[2px]">{threat.loc}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="w-[100px] h-[5px] rounded-[3px] bg-white/8 overflow-hidden">
                      <div 
                        className={`h-full rounded-[3px] transition-all duration-1000 ${
                          threat.risk > 0.5 
                            ? 'bg-gradient-to-r from-[#f97316] to-[#ef4444]' 
                            : 'bg-gradient-to-r from-[#4ade80] to-[#06b6d4]'
                        }`}
                        style={{ width: `${threat.risk * 100}%` }}
                      />
                    </div>
                    <span className={`font-mono text-[11px] font-bold mt-[5px] ${
                      threat.status === 'FRAUD' ? 'text-[#f87171]' : 'text-[#4ade80]'
                    }`}>
                      {threat.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — Stats grid */}
          <div className="stats-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            {statsData.map((stat, idx) => (
              <div 
                key={idx}
                className="stat-box p-8 rounded-[28px] glass border border-white/6 text-center"
              >
                <div 
                  className="font-syne font-extrabold text-[40px]"
                  style={{ color: stat.color }}
                >
                  {stat.val}
                </div>
                <div className="font-inter text-[12px] text-white/45 leading-[1.5] mt-2">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
