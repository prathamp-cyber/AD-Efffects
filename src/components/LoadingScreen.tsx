'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const nameChars = Array.from("The AD Efffects");

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.2,
      }
    }
  };

  const charVariants = {
    hidden: { 
      opacity: 0, 
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1] as const,
      }
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
      const exitTimer = setTimeout(() => {
        document.body.style.overflow = '';
        onComplete();
      }, 800); // duration of the slide-up animation
      return () => clearTimeout(exitTimer);
    }, 2800);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isLoaded && (
        <motion.div
          className="fixed inset-0 bg-background z-[10000] flex flex-col items-center justify-center transition-colors duration-300"
          exit={{ 
            clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] }
          }}
        >
          <div className="text-center overflow-hidden px-4">
            <motion.h1
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-4xl md:text-6xl font-cormorant font-light tracking-[0.25em] text-primary flex justify-center"
            >
              {nameChars.map((char, index) => (
                <motion.span
                  key={index}
                  variants={charVariants}
                  className="inline-block"
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="text-xs uppercase tracking-[0.4em] text-secondary mt-4"
            >
              Architecture & Interiors
            </motion.p>
          </div>
          
          {/* Subtle loading line */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-border-custom overflow-hidden">
            <motion.div
              initial={{ left: '-100%' }}
              animate={{ left: '0%' }}
              transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-0 bottom-0 left-0 right-0 bg-accent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
