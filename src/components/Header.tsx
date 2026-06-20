'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'portfolio', label: 'PORTFOLIO' },
    { id: 'our-story', label: 'OUR STORY' },
    { id: 'featured', label: 'FEATURED' },
    { id: 'our-influence', label: 'OUR INFLUENCE' },
    { id: 'blog', label: 'BLOG' },
    { id: 'contact', label: 'CONTACT' },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header 
        className="w-full flex flex-col items-center bg-white relative"
        style={{ paddingTop: '80px' }} // Exact 80px top padding
      >
        {/* Mobile Header Bar */}
        <div className="md:hidden w-full flex justify-between items-center px-6 py-5">
          <button 
            onClick={() => handleTabClick('portfolio')}
            className="text-sm font-cormorant font-light tracking-[0.25em] text-primary focus:outline-none"
          >
            AD Efffects
          </button>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="text-primary focus:outline-none p-2"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 stroke-[1.25]" />
          </button>
        </div>

        {/* Desktop Header Layout */}
        <div className="hidden md:flex flex-col items-center w-full">
          
          {/* Logo: Brand name cursive logo with capital/small letter combo */}
          <div 
            className="flex flex-col items-center relative select-none"
            style={{ marginBottom: '32px' }} // Exact 32px gap to socials
          >
            <button 
              onClick={() => handleTabClick('portfolio')}
              className="font-script text-[64px] text-primary leading-none focus:outline-none cursor-pointer hover:opacity-75 transition-opacity"
            >
              AD Efffects
            </button>
            {/* Centered horizontal underline (approx 60% of script width) */}
            <div className="w-[180px] h-[1px] bg-primary mt-3" />
          </div>

          {/* Social Icons Row - ~40px diameter, 16px spaced, 32px gap below socials */}
          <div 
            className="flex space-x-4 items-center"
            style={{ marginBottom: '32px' }} // Exact 32px gap to nav
          >
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#f4f4f4] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] hover:scale-105 transition-all duration-300"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#f4f4f4] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] hover:scale-105 transition-all duration-300"
              aria-label="Facebook"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#f4f4f4] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] hover:scale-105 transition-all duration-300"
              aria-label="YouTube"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
                <polygon points="10 15 15 12 10 9" fill="currentColor" />
              </svg>
            </a>
          </div>

          {/* Navigation Bar - Uppercase, letter-spaced, spaced 40px (gap-x-10) */}
          <nav className="flex items-center justify-center gap-x-10 px-6 pb-4 w-[90%] max-w-4xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`text-[12px] md:text-[13px] uppercase tracking-[0.28em] font-light transition-all duration-300 hover:text-accent cursor-pointer ${
                  activeTab === tab.id 
                    ? 'text-accent font-semibold scale-105' 
                    : 'text-primary/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[100] bg-white flex flex-col justify-between p-8"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-cormorant font-light tracking-[0.25em] text-primary">
                AD Efffects
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary focus:outline-none p-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 stroke-[1.25]" />
              </button>
            </div>

            <nav className="flex flex-col space-y-6 my-auto pl-4">
              {tabs.map((tab, idx) => (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.08, duration: 0.6, ease: "easeOut" }}
                  key={tab.id}
                >
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={`text-2xl font-cormorant font-light tracking-[0.2em] uppercase text-left w-full cursor-pointer hover:text-accent ${
                      activeTab === tab.id ? 'text-accent font-normal' : 'text-primary'
                    }`}
                  >
                    {tab.label}
                  </button>
                </motion.div>
              ))}
            </nav>

            <div className="flex flex-col space-y-3 pl-4 text-[9px] uppercase tracking-[0.25em] text-secondary font-light">
              <p>hello@adefffects.com</p>
              <p>© 2026 AD Efffects. All rights reserved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
