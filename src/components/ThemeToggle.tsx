'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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

  // Hide on admin (/ad) or super admin (/nexora) panels
  const isPanel = pathname?.startsWith('/ad') || pathname?.startsWith('/nexora') || pathname?.startsWith('/admin');
  if (isPanel) return null;

  return (
    <button 
      onClick={toggleTheme}
      className={`fixed bottom-4 right-4 z-[9999] w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.12)] hover:scale-105 transition-all duration-300 cursor-pointer select-none outline-none ${
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
            <Moon className="w-3 h-3 stroke-[2.5]" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Sun className="w-3 h-3 stroke-[1.25]" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
