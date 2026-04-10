import React, { useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const AIDecisionSection = () => {
  const [step, setStep] = useState(-1);
  const [activeScenario, setActiveScenario] = useState(0);
  const [riskScore, setRiskScore] = useState(0);

  const scenarios = [
    { user: "Elena K.", amount: "$12,450", location: "New York, USA", device: "iPhone 15 Pro", risk: 0.09, verdict: "ALLOW" },
    { user: "Unknown", amount: "$1,200,000", location: "Tor Exit Node", device: "Masked VM", risk: 0.98, verdict: "BLOCK" },
    { user: "Marcus T.", amount: "$890", location: "London, UK", device: "New Browser", risk: 0.44, verdict: "CHALLENGE" },
  ];

  const runSimulation = (idx) => {
    setActiveScenario(idx);
    setStep(0);
    setRiskScore(0);

    setTimeout(() => setStep(1), 400);
    setTimeout(() => setStep(2), 1100);

    // Increment risk score
    let targetRisk = scenarios[idx].risk * 100;
    let currentScore = 0;
    const interval = setInterval(() => {
      currentScore += 4;
      if (currentScore >= targetRisk) {
        setRiskScore(targetRisk);
        clearInterval(interval);
      } else {
        setRiskScore(currentScore);
      }
    }, 28);

    setTimeout(() => setStep(3), 2300);
  };

  useEffect(() => {
    runSimulation(0);
  }, []);

  const pipelineSteps = [
    { icon: "👤", label: "User Request" },
    { icon: "🔬", label: "Data Analysis" },
    { icon: "📊", label: "Risk Score" },
    { icon: "⚡", label: "Verdict" },
  ];

  return (
    <section id="ai-engine" className="relative py-32 px-6 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_55%_50%,rgba(6,182,212,0.09)_0%,transparent_66%)]" />
      </div>

      <div className="max-w-[1024px] mx-auto relative z-10">
        {/* TOP — Header */}
        <div className="text-center mb-16">
          <div className="font-mono text-[11px] text-[#38bdf8] tracking-widest uppercase mb-4">
            AI DECISION ENGINE
          </div>
          <h2 className="font-syne font-extrabold text-[clamp(40px,5.5vw,68px)] leading-[1.05] text-white">
            Watch the AI <br />
            <span className="g-text">Think in Real-Time</span>
          </h2>
        </div>

        {/* SIMULATION PANEL */}
        <div className="w-full p-[40px_44px] rounded-[40px] glass border border-white/7 relative overflow-hidden">
          
          {/* A. PIPELINE STEPS */}
          <div className="grid grid-cols-4 gap-3 mb-10 relative">
            {pipelineSteps.map((s, i) => (
              <div key={i} className={`flex flex-col items-center gap-2 transition-opacity duration-500 ${step < i ? 'opacity-40' : 'opacity-100'}`}>
                <div 
                  className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-xl transition-all duration-500 ${
                    step >= i ? 'bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] shadow-[0_0_24px_rgba(124,58,237,0.5)]' : 'bg-white/5'
                  }`}
                >
                  {s.icon}
                </div>
                <span className="font-mono text-[10px] text-white/35 uppercase tracking-[0.08em] text-center">{s.label}</span>
                
                {/* Connector line */}
                {i < 3 && (
                  <div className="absolute top-6 left-[calc(25%*i+24px)] w-[calc(25%-48px)] h-[1px] bg-white/8">
                    <div 
                      className="h-full bg-[#7c3aed]/40 transition-all duration-500" 
                      style={{ width: step > i ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* B. DATA CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-9">
            {/* ROW 1 */}
            <div className="p-[16px_18px] rounded-[18px] glass border border-white/7">
              <div className="font-mono text-[10px] text-white/30 mb-[6px] uppercase tracking-widest">USER</div>
              <div className="font-syne font-bold text-[15px] text-white">{scenarios[activeScenario].user}</div>
            </div>
            <div className="p-[16px_18px] rounded-[18px] glass border border-white/7">
              <div className="font-mono text-[10px] text-white/30 mb-[6px] uppercase tracking-widest">AMOUNT</div>
              <div className="font-syne font-bold text-[15px] text-white">{scenarios[activeScenario].amount}</div>
            </div>
            <div className="p-[16px_18px] rounded-[18px] glass border border-white/7">
              <div className="font-mono text-[10px] text-white/30 mb-[6px] uppercase tracking-widest">LOCATION</div>
              <div className="font-syne font-bold text-[15px] text-white">{scenarios[activeScenario].location}</div>
            </div>
            
            {/* ROW 2 */}
            <div className="p-[16px_18px] rounded-[18px] glass border border-white/7">
              <div className="font-mono text-[10px] text-white/30 mb-[6px] uppercase tracking-widest">DEVICE</div>
              <div className="font-syne font-bold text-[15px] text-white">{scenarios[activeScenario].device}</div>
            </div>
            <div className="md:col-span-2 p-[16px_18px] rounded-[18px] glass border border-white/7">
              <div className="font-mono text-[10px] text-[#a78bfa] mb-[2px] uppercase tracking-widest">RISK SCORE</div>
              <div className="w-full h-1.5 rounded-full bg-white/10 my-2 overflow-hidden">
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${riskScore}%`,
                    background: riskScore < 40 ? '#4ade80' : riskScore < 70 ? '#fbbf24' : '#f87171' 
                  }}
                />
              </div>
              <div className="font-syne font-extrabold text-[22px] text-white">{(riskScore / 100).toFixed(2)}</div>
            </div>
          </div>

          {/* C. VERDICT DISPLAY */}
          <div className="text-center min-h-[80px] flex items-center justify-center">
            {step < 3 ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#a78bfa] anim-breathe" />
                <span className="font-mono text-[13px] text-white/30 uppercase tracking-widest">Processing...</span>
              </div>
            ) : (
              <div className={`inline-flex items-center gap-3 p-[18px_36px] rounded-[18px] font-syne font-extrabold text-[24px] animate-in zoom-in duration-500 ${
                scenarios[activeScenario].verdict === 'ALLOW' ? 'bg-[#4ade80]/8 border border-[#4ade80]/35 text-[#4ade80]' :
                scenarios[activeScenario].verdict === 'BLOCK' ? 'bg-[#f87171]/8 border border-[#f87171]/35 text-[#f87171]' :
                'bg-[#fbbf24]/8 border border-[#fbbf24]/35 text-[#fbbf24]'
              }`}>
                {scenarios[activeScenario].verdict === 'ALLOW' ? '✅ TRANSACTION ALLOWED' :
                 scenarios[activeScenario].verdict === 'BLOCK' ? '🚫 TRANSACTION BLOCKED' :
                 '🔑 CHALLENGE REQUIRED'}
              </div>
            )}
          </div>

          {/* D. SCENARIO BUTTONS */}
          <div className="flex justify-center gap-[10px] mt-7 relative z-10">
            {scenarios.map((_, i) => (
              <button 
                key={i}
                onClick={() => runSimulation(i)}
                className={`font-mono text-[11px] p-[8px_18px] rounded-full transition-all ${
                  activeScenario === i 
                    ? 'bg-[#7c3aed] text-white border-transparent shadow-lg shadow-[#7c3aed]/30' 
                    : 'glass text-white/45 border-white/10 hover:border-white/30'
                }`}
              >
                Scenario {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDecisionSection;
