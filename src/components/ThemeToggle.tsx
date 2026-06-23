'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Always default to 'light' (Day Mode / White Screen) on initial load
    setTheme('light');
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
  }, []);

  const applyTheme = (nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    
    // Add transitioning-out class to fade away all page content components
    document.documentElement.classList.remove('theme-switching-in');
    document.documentElement.classList.add('theme-switching-out');
    
    // Switch the theme after the fade-out completes (500ms)
    setTimeout(() => {
      applyTheme(nextTheme);
      
      // Swap transition classes to trigger staggered fade-in animations
      document.documentElement.classList.remove('theme-switching-out');
      document.documentElement.classList.add('theme-switching-in');
      
      // Clean up the transitioning-in class after all animations complete (2200ms)
      setTimeout(() => {
        document.documentElement.classList.remove('theme-switching-in');
      }, 2200);
    }, 500);
  };

  if (!mounted) return null;

  return (
    <button 
      onClick={toggleTheme}
      className={`fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:scale-105 transition-all duration-300 cursor-pointer select-none outline-none ${
        theme === 'light' 
          ? 'bg-card-bg border border-primary/60 text-primary' 
          : 'bg-background/80 border border-border-custom text-primary'
      }`}
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Moon className="w-5 h-5 stroke-[2.5]" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Sun className="w-5 h-5 stroke-[1.25]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
