import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

gsap.registerPlugin(ScrollTrigger);

const CTASection = () => {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 72%',
      }
    });

    // Badge
    tl.from('.cta-badge', {
      opacity: 0,
      y: 28,
      duration: 0.8,
      ease: 'power3.out',
    });

    // Heading lines
    tl.from('.cta-h2-line', {
      y: 60,
      opacity: 0,
      stagger: 0.15,
      duration: 0.9,
      ease: 'power4.out',
    }, '-=0.4');

    // Subheading
    tl.from('.cta-sub', {
      opacity: 0,
      y: 24,
      duration: 0.8,
      ease: 'power3.out',
    }, '-=0.5');

    // Buttons and trust signals
    tl.from('.cta-item', {
      opacity: 0,
      y: 36,
      stagger: 0.12,
      duration: 0.7,
      ease: 'power2.out',
    }, '-=0.4');
  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-32 px-6"
    >
      {/* LAYER 1 — Static Background */}
      <div className="absolute inset-0 w-full h-full z-[1] pointer-events-none overflow-hidden">
        <img 
          src="/images/cta.webp" 
          alt="CTA Background" 
          className="w-full h-full object-content opacity-40"
        />
      </div>

      {/* LAYER 2 — Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none z-[2]">
        <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-b from-[#04020f] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[280px] bg-gradient-to-t from-[#04020f] to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_50%_50%,transparent_40%,#04020f_100%)]" />
      </div>

      {/* LAYER 3 — Content */}
      <div className="relative z-[3] max-w-[760px] mx-auto text-center">
        {/* A. BADGE */}
        <div className="cta-badge inline-flex items-center gap-2 p-[7px_20px] rounded-full glass border border-[#4ade80]/25 mb-9">
          <div className="w-[6px] h-[6px] rounded-full bg-[#4ade80] anim-breathe" />
          <span className="font-mono text-[11px] text-[#86efac] tracking-[0.12em] uppercase">Now in Private Beta</span>
        </div>

        {/* B. H2 */}
        <h2 className="font-syne font-extrabold text-[clamp(52px,7vw,88px)] leading-none mb-6">
          <div className="cta-h2-line text-white">Join the</div>
          <div className="cta-h2-line g-text">Next Layer</div>
          <div className="cta-h2-line text-white">of Finance.</div>
        </h2>

        {/* C. SUBHEADING */}
        <p className="cta-sub max-w-[540px] mx-auto font-inter font-light text-[19px] text-white/55 leading-[1.75] mb-12">
          Integrate SecureAI Pay Layer in under 30 minutes. Built for scale — from startup to enterprise.
        </p>

        {/* D. BUTTONS */}
        <div className="cta-item flex flex-row flex-wrap gap-[14px] justify-center mb-12">
          <button 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
            className="mag-btn glow-v font-syne font-extrabold text-[16px] text-white p-[18px_40px] rounded-[18px] bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] border-none"
          >
            {isAuthenticated ? 'Back to Dashboard →' : 'Start Building Free →'}
          </button>
          <button 
            onClick={() => navigate('/audit')}
            className="mag-btn font-syne font-bold text-[16px] text-white p-[17px_40px] rounded-[18px] glass border border-white/15 hover:border-[#7c3aed]/50"
          >
            View Live Audit
          </button>
        </div>

        {/* E. TRUST SIGNALS */}
        <div className="cta-item flex flex-wrap justify-center gap-6 mb-24">
          {[
            "No credit card required",
            "SOC2 Certified",
            "Deploy in 30 min",
            "24/7 AI Support"
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="text-[#a78bfa] font-inter font-medium text-sm">✓</span>
              <span className="font-inter text-[13px] text-white/45">{item}</span>
            </div>
          ))}
        </div>

        {/* F. FOOTER */}
        <footer className="pt-7 border-t border-white/7 text-center">
          <p className="font-mono text-[10px] text-white/25">
            © 2025 SecureAI Pay Layer Inc. · Privacy · Terms · Security
          </p>
        </footer>
      </div>
    </section>
  );
};

export default CTASection;
