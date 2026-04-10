import React, { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ParticleField from '../components/landing/ParticleField';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import ProblemSection from '../components/landing/ProblemSection';
import SystemBuildSection from '../components/landing/SystemBuildSection';
import AIDecisionSection from '../components/landing/AIDecisionSection';
import DataFlowSection from '../components/landing/DataFlowSection';
import DashboardSection from '../components/landing/DashboardSection';
import SecuritySection from '../components/landing/SecuritySection';
import CTASection from '../components/landing/CTASection';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <main className="bg-[#04020f] min-h-screen overflow-x-hidden selection:bg-[#7c3aed]/30 selection:text-white">
      <ParticleField />
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <SystemBuildSection />
      <AIDecisionSection />
      <DataFlowSection />
      <DashboardSection />
      <SecuritySection />
      <CTASection />
    </main>
  );
}
