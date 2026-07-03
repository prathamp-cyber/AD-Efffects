'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hideOurInfluence?: boolean;
  hideBlog?: boolean;
}

export default function Header({ activeTab, onTabChange, hideOurInfluence, hideBlog }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'portfolio', label: 'PORTFOLIO' },
    { id: 'our-story', label: 'OUR STORY' },
    { id: 'featured', label: 'FEATURED' },
    { id: 'our-influence', label: 'OUR INFLUENCE' },
    { id: 'blog', label: 'BLOG' },
    { id: 'contact', label: 'CONTACT' },
  ].filter(tab => {
    if (tab.id === 'our-influence' && hideOurInfluence) return false;
    if (tab.id === 'blog' && hideBlog) return false;
    return true;
  });

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  // Animation Variants for Desktop Header Entrance
  const logoVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.25, 1, 0.5, 1] as const, // Premium easeOut
      }
    }
  };

  const lineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: {
        delay: 0.5,
        duration: 0.8,
        ease: [0.25, 1, 0.5, 1] as const,
      }
    }
  };

  const socialsContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.6,
      }
    }
  };

  const socialIconVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      }
    }
  };

  const navContainerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.8,
      }
    }
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
      }
    }
  };

  const mobileHeaderVariants = {
    hidden: { opacity: 0, y: -15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 1, 0.5, 1] as const,
      }
    }
  };

  return (
    <>
      <header 
        className="site-header w-full flex flex-col items-center bg-background relative transition-colors duration-300"
      >
        {/* Mobile Header Bar */}
        <motion.div 
          variants={mobileHeaderVariants}
          initial="hidden"
          animate="visible"
          className="md:hidden w-full flex justify-between items-center px-5 py-4 header-logo-container"
        >
          <div className="flex flex-col items-start select-none">
            <button 
              onClick={() => handleTabClick('portfolio')}
              className="brand-logo text-[15px] sm:text-[18px] text-primary focus:outline-none leading-none tracking-[0.15em] font-semibold"
            >
              THE AD EFFFECT
            </button>
            <span className="text-[7px] uppercase tracking-[0.2em] text-secondary mt-1.5 font-sans font-semibold">Form Follows Function</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="text-primary focus:outline-none p-2 -mr-2"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 stroke-[1.25]" />
          </button>
        </motion.div>

        {/* Desktop Header Layout */}
        <div className="hidden md:flex flex-col items-center w-full">
          
          {/* Logo: Brand name cursive logo with capital/small letter combo */}
          <div 
            className="flex flex-col items-center w-full relative select-none header-logo-container"
            style={{ marginBottom: '32px' }} // Exact 32px gap to socials
          >
            <motion.button 
              variants={logoVariants}
              initial="hidden"
              animate="visible"
              onClick={() => handleTabClick('portfolio')}
              className="brand-logo text-[44px] md:text-[56px] text-primary leading-none focus:outline-none cursor-pointer hover:opacity-75 transition-opacity tracking-[0.18em] font-semibold"
            >
              THE AD EFFFECT
            </motion.button>
            <motion.span 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 0.55, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-[10px] uppercase tracking-[0.3em] text-secondary mt-2.5 font-sans font-semibold"
            >
              Form Follows Function
            </motion.span>
            {/* Centered horizontal underline (approx 60% of script width) */}
            <motion.div 
              variants={lineVariants}
              initial="hidden"
              animate="visible"
              className="w-[180px] h-[1px] bg-primary mt-3 origin-center" 
            />
          </div>

          {/* Social Icons Row - ~40px diameter, 16px spaced, 32px gap below socials */}
          <motion.div 
            variants={socialsContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex space-x-4 items-center header-socials-container"
            style={{ marginBottom: '32px' }} // Exact 32px gap to nav
          >
            <motion.a 
              variants={socialIconVariants}
              href="https://www.instagram.com/the_ad_effect?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-social-bg hover:bg-social-hover flex items-center justify-center text-primary hover:scale-105 transition-all duration-300"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </motion.a>
            <motion.a 
              variants={socialIconVariants}
              href="https://pinterest.com/the_ad_effect" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-social-bg hover:bg-social-hover flex items-center justify-center text-primary hover:scale-105 transition-all duration-300"
              aria-label="Pinterest"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 22c.4-2.8 1.1-5.4 1.1-5.4s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.5-.2 1.1.6 2 1.7 2 2.1 0 3.7-2.2 3.7-5.3 0-2.8-2-4.7-4.9-4.7-3.3 0-5.3 2.5-5.3 5.1 0 1 .4 2 .9 2.6.1.1.1.2.1.3-.1.4-.3 1.2-.3 1.3-.1.2-.2.3-.5.1-1.7-.8-2.7-3.2-2.7-5.1 0-4.1 3-7.9 8.6-7.9 4.5 0 8 3.2 8 7.5 0 4.5-2.8 8.1-6.7 8.1-1.3 0-2.6-.7-3-1.5 0 0-.7 2.5-.8 3.1-.3 1.1-1 2.5-1.5 3.3" />
              </svg>
            </motion.a>
          </motion.div>

          {/* Navigation Bar - Uppercase, letter-spaced, spaced 40px (gap-x-10) */}
          <motion.nav 
            variants={navContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-center gap-x-10 px-6 pb-4 w-[90%] max-w-4xl mx-auto flex-wrap header-nav-container"
          >
            {tabs.map((tab) => (
              <motion.button
                variants={navItemVariants}
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`text-[12px] md:text-[13px] uppercase tracking-[0.28em] font-bold transition-all duration-300 cursor-pointer relative pb-2 group ${
                  activeTab === tab.id 
                    ? 'text-primary' 
                    : 'text-primary/70 hover:text-primary'
                }`}
              >
                <span className="mr-[-0.28em]">{tab.label}</span>
                {activeTab === tab.id ? (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                ) : (
                  <span className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-primary scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
                )}
              </motion.button>
            ))}
          </motion.nav>
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
            className="site-mobile-menu fixed inset-0 z-[10000] bg-background text-primary flex flex-col p-6 transition-colors duration-300 overflow-y-auto"
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col items-start select-none">
                <span className="brand-logo text-[15px] sm:text-[18px] text-primary leading-none tracking-[0.15em] font-semibold">
                  THE AD EFFFECT
                </span>
                <span className="text-[7px] uppercase tracking-[0.2em] text-secondary mt-1.5 font-sans font-semibold">Form Follows Function</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary focus:outline-none p-2 -mr-2"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 stroke-[1.25]" />
              </button>
            </div>

            <nav className="flex flex-col gap-4 py-12">
              {tabs.map((tab, idx) => (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.08, duration: 0.6, ease: "easeOut" }}
                  key={tab.id}
                >
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={`text-[22px] font-cormorant font-bold tracking-[0.14em] uppercase text-left w-full cursor-pointer transition-colors duration-300 ${
                      activeTab === tab.id ? 'text-primary border-b border-primary/20 pb-1' : 'text-primary/70 hover:text-primary'
                    }`}
                  >
                    <span className="mr-[-0.14em]">{tab.label}</span>
                  </button>
                </motion.div>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-3 text-[9px] uppercase tracking-[0.22em] text-secondary font-light">
              <p>hello@adefffects.com</p>
              <p>© 2026 The AD Efffects. All rights reserved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
