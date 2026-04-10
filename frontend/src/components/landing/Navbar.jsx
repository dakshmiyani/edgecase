import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ease-in-out px-6 ${
        scrolled
          ? 'h-16 bg-[#04020f]/85 backdrop-blur-xl border-b border-white/7'
          : 'h-20 bg-transparent border-none'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        {/* LEFT — Logo group */}
        <Link to="/" className="flex items-center gap-[10px] hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] anim-breathe" />
          <span className="font-syne font-extrabold text-[17px] text-white">
            SecureAI <span className="text-[#a78bfa]">Pay</span>
          </span>
        </Link>

        {/* CENTER — Nav links */}
        <div className="hidden lg:flex items-center gap-8">
          {['System', 'AI Engine', 'Security'].map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase().replace(' ', '-')}`}
              className="font-inter text-sm font-normal text-white/50 hover:text-[#a78bfa] transition-colors"
            >
              {link}
            </a>
          ))}
          <Link
            to="/docs"
            className="font-inter text-sm font-normal text-white/50 hover:text-[#a78bfa] transition-colors"
          >
            Docs
          </Link>
          {!isAuthenticated && (
            <Link 
              to="/login"
              className="font-inter text-sm font-medium text-[#a78bfa] hover:text-white transition-colors"
            >
              Login
            </Link>
          )}
        </div>

        {/* RIGHT — CTA button */}
        <button 
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
          className="mag-btn font-syne font-bold text-[13px] text-white border border-[#7c3aed]/40 rounded-full py-[9px] px-[22px] hover:border-[#7c3aed]/90 hover:bg-[#7c3aed]/12 transition-all"
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
