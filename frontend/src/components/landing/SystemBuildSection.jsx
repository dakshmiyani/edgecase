import React, { useState, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SystemBuildSection = () => {
  const [activeLayer, setActiveLayer] = useState(0);
  const containerRef = useRef(null);

  const layerData = [
    { icon: "🧬", name: "Identity Layer", desc: "Biometric + behavioral fingerprinting. Every user, every device — uniquely profiled.", gradient: "linear-gradient(135deg,#7c3aed,#5b21b6)" },
    { icon: "🧠", name: "AI Engine", desc: "Neural risk models trained on 4B+ transactions. Learns in real-time, adapts instantly.", gradient: "linear-gradient(135deg,#0891b2,#06b6d4)" },
    { icon: "⚡", name: "Decision Layer", desc: "Sub-12ms verdict engine. ALLOW, BLOCK, or CHALLENGE — with full explainability.", gradient: "linear-gradient(135deg,#d97706,#f59e0b)" },
    { icon: "✅", name: "Execution Layer", desc: "Seamless routing to payment rails. Zero latency, zero friction for legitimate transactions.", gradient: "linear-gradient(135deg,#059669,#10b981)" },
    { icon: "🔐", name: "Audit & Comply", desc: "Full cryptographic audit trail. PCI-DSS, SOC2, GDPR — compliance wired into every transaction.", gradient: "linear-gradient(135deg,#be185d,#ec4899)" }
  ];

  useGSAP(() => {
    // Header animation
    gsap.from('.system-h2', {
      scrollTrigger: {
        trigger: '.system-h2',
        start: 'top 80%',
      },
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
    });

    // Layer cards staggered animation
    gsap.from('.layer-card', {
      scrollTrigger: {
        trigger: '.layer-cards-list',
        start: 'top 92%',
        toggleActions: 'play none none none',
      },
      x: -56,
      opacity: 0,
      scale: 0.92,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out',
    });

    // Spline container animation (now Hologram)
    gsap.from('.system-hologram-container', {
      scrollTrigger: {
        trigger: '.system-hologram-container',
        start: 'top 70%',
      },
      scale: 0.8,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out',
    });

    // Mouse Tilt Logic
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;

      gsap.to('.hologram-card', {
        rotateY: x * 30,
        rotateX: -y * 30,
        duration: 1,
        ease: 'power2.out',
      });
      
      gsap.to('.hologram-reflection', {
        rotateY: x * 30,
        rotateX: -y * 30,
        x: -x * 20,
        duration: 1,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      id="system"
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_50%,rgba(124,58,237,0.13)_0%,transparent_68%)]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* TOP — Header */}
        <div className="text-center mb-20">
          <div className="font-mono text-[11px] text-[#a78bfa] tracking-widest uppercase mb-4">
            THE ARCHITECTURE
          </div>
          <h2 className="system-h2 font-syne font-extrabold text-[clamp(40px,5.5vw,68px)] leading-[1.05] text-white">
            Five Layers. <br />
            <span className="g-text">One Intelligent System.</span>
          </h2>
        </div>

        {/* CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-18 lg:gap-[72px] items-center">
          {/* LEFT — Layer cards */}
          <div className="layer-cards-list flex flex-col gap-3.5 w-full">
            {layerData.map((layer, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveLayer(idx)}
                style={{ opacity: 1 }}
                className={`layer-card group w-full p-[20px_22px] rounded-[24px] transition-all duration-300 cursor-pointer border ${
                  activeLayer === idx 
                    ? 'border-[#7c3aed]/40 bg-[#7c3aed]/6' 
                    : 'glass border-white/6 hover:border-[#7c3aed]/40 hover:bg-[#7c3aed]/6'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* LEFT — icon box */}
                  <div 
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center text-xl shrink-0" 
                    style={{ background: layer.gradient }}
                  >
                    {layer.icon}
                  </div>

                  {/* MIDDLE — text */}
                  <div className="flex-1">
                    <h3 className="font-syne font-bold text-[15px] text-white mb-1">{layer.name}</h3>
                    <p className="font-inter text-[13px] text-white/55 leading-[1.6]">{layer.desc}</p>
                  </div>

                  {/* RIGHT — active indicator */}
                  <div 
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 transition-all duration-300 ${
                      activeLayer === idx 
                        ? 'bg-[#a78bfa] [box-shadow:0_0_10px_rgba(167,139,250,0.9)]' 
                        : 'bg-white/18'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT — Cinematic 3D Hologram */}
          <div className="system-hologram-container relative w-full h-[600px] flex items-center justify-center perspective-1200 py-12">
            {/* 3D Wrapper */}
            <div className="hologram-card relative w-full max-w-[480px] aspect-square preserve-3d">
              {/* MAIN VISUAL */}
              <div className="relative w-full h-full overflow-hidden rounded-[20px] shadow-[0_0_50px_rgba(6,182,212,0.15)] flex items-center justify-center">
                <img 
                  src="/images/systembuild.webp" 
                  alt="System Visual" 
                  className="w-full h-full object-cover mix-blend-screen opacity-90 scale-105"
                  style={{ 
                    maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 85%)',
                    WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 85%)'
                  }}
                />
                
                {/* Holographic Overlays */}
                <div className="absolute inset-0 hologram-scanlines opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#04020f]/60 via-transparent to-transparent pointer-events-none" />
                
                {/* Random Tech Bits (CSS particles) */}
                <div className="absolute top-10 left-10 w-1 h-1 bg-cyan-400 rounded-full anim-breathe" />
                <div className="absolute bottom-20 right-14 w-1.5 h-1.5 bg-violet-400 rounded-full anim-breathe" style={{ animationDelay: '1s' }} />
              </div>

              {/* FLOOR REFLECTION */}
              <div className="hologram-reflection absolute top-[105%] left-0 w-full h-[40%] preserve-3d opacity-25 pointer-events-none">
                <div className="w-full h-full reflection-mask scale-y-[-1] overflow-hidden">
                  <img 
                    src="/images/systembuild.webp" 
                    alt="Reflection" 
                    className="w-full h-full object-cover mix-blend-screen filter blur-md"
                  />
                </div>
              </div>

              {/* Ambient Glow */}
              <div className="absolute -inset-20 bg-cyan-500/10 blur-[120px] rounded-full -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SystemBuildSection;
