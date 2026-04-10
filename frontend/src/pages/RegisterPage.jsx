import React from 'react';
import RegistrationForm from '../components/auth/RegistrationForm';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#04020f] flex flex-col">
      {/* Minimal Nav */}
      <nav className="p-6">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">SecureAI Pay</span>
        </Link>
      </nav>

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 relative z-10">
        <RegistrationForm />
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-white/20">
        End-to-end encrypted • Zero knowledge
      </footer>
    </div>
  );
}
