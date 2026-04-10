import React, { useEffect, useRef } from 'react';

const DataFlowSection = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let particles = [];
    const containerHeight = canvas.offsetHeight || 360;
    const containerWidth = canvas.offsetWidth || 1280;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    class Particle {
      constructor() {
        this.x = 0;
        this.y = (canvas.height / 2) + (Math.random() - 0.5) * 90;
        this.vx = 2.5 + Math.random() * 1.8;
        this.size = Math.random() * 3 + 1;
        this.alpha = 1;
        this.color = Math.random() > 0.5 ? '#7c3aed' : '#06b6d4';
        this.trail = [];
        this.trailLen = 18;
      }

      update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLen) this.trail.shift();
        this.x += this.vx;
      }

      draw() {
        // Draw trail
        this.trail.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, this.size * (i / this.trailLen), 0, Math.PI * 2);
          ctx.fillStyle = `${this.color}${Math.floor((i / this.trailLen) * 0.45 * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
        });

        // Draw head
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.18) {
        particles.push(new Particle());
      }

      particles = particles.filter(p => p.x < canvas.width);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const stats = [
    { icon: "⚡", val: "4.2M", label: "TXN / sec" },
    { icon: "📡", val: "847", label: "Signals / decision" },
    { icon: "🧠", val: "0.3ms", label: "Inference time" },
    { icon: "✅", val: "99.99%", label: "Uptime SLA" },
  ];

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_50%,rgba(124,58,237,0.10)_0%,transparent_65%)]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* TOP — Header */}
        <div className="text-center mb-16">
          <div className="font-mono text-[11px] text-[#a78bfa] tracking-widest uppercase mb-4">
            DATA INTELLIGENCE
          </div>
          <h2 className="font-syne font-extrabold text-[clamp(40px,5.5vw,68px)] leading-[1.05] text-white">
            Billions of Signals. <br />
            <span className="g-text">One Unified Intelligence.</span>
          </h2>
        </div>

        {/* MAIN VISUAL CONTAINER */}
        <div className="relative w-full h-[360px] rounded-[40px] glass border border-[#7c3aed]/10 overflow-hidden">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {/* LEFT LABEL */}
          <div className="absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="font-mono text-[11px] text-[#a78bfa] uppercase tracking-widest">Transaction Stream</div>
            <div className="font-syne font-extrabold text-[26px] text-white mt-1">Live</div>
          </div>

          {/* RIGHT LABEL */}
          <div className="absolute right-7 top-1/2 -translate-y-1/2 text-right pointer-events-none">
            <div className="font-mono text-[11px] text-[#38bdf8] uppercase tracking-widest">AI Analysis</div>
            <div className="font-syne font-extrabold text-[26px] text-white mt-1">Active</div>
          </div>

          {/* CENTER AI NODE */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
            {/* Outer ring 2 */}
            <div className="absolute w-[100px] h-[100px] rounded-full border border-[#06b6d4]/15 anim-spin-ccw" />
            {/* Outer ring 1 */}
            <div className="absolute w-[72px] h-[72px] rounded-full border border-[#7c3aed]/25 anim-spin-cw" />
            {/* Core */}
            <div className="relative w-[52px] h-[52px] rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] anim-breathe glow-v flex items-center justify-center text-2xl">
              🧠
            </div>
          </div>
        </div>

        {/* BOTTOM STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-5">
          {stats.map((s, idx) => (
            <div key={idx} className="p-[20px_22px] rounded-[20px] glass border border-white/6 text-center">
              <span className="text-[22px] block mb-2">{s.icon}</span>
              <div className="font-syne font-extrabold text-[22px] g-text">{s.val}</div>
              <div className="font-mono text-[10px] text-white/35 mt-[5px] uppercase tracking-[0.08em]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DataFlowSection;
