'use client';

interface FooterProps {
  onTabChange?: (tab: string) => void;
}

export default function Footer({ onTabChange }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const tabs = [
    { id: 'portfolio', label: 'PORTFOLIO' },
    { id: 'our-story', label: 'OUR STORY' },
    { id: 'featured', label: 'FEATURED' },
    { id: 'our-influence', label: 'OUR INFLUENCE' },
    { id: 'blog', label: 'BLOG' },
    { id: 'contact', label: 'CONTACT' },
  ];

  return (
    <footer className="w-full bg-white flex flex-col items-center pt-20 pb-16 border-t border-border-custom/40">
      
      {/* Centered vertical tick line mirroring the elegant entry theme */}
      <div className="w-[1px] h-10 bg-primary/20 mb-8" />

      {/* Cursive brand logo (smaller version matching the header) */}
      <div className="flex flex-col items-center relative select-none mb-8">
        <button 
          onClick={() => onTabChange?.('portfolio')}
          className="font-script text-[44px] text-primary leading-none focus:outline-none cursor-pointer hover:opacity-75 transition-opacity"
        >
          AD Efffects
        </button>
        <div className="w-[120px] h-[1px] bg-primary/60 mt-2" />
      </div>

      {/* Social Icons Row */}
      <div className="flex space-x-4 items-center justify-center mb-8">
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] hover:scale-105 transition-all duration-300"
          aria-label="Instagram"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        </a>
        <a 
          href="https://facebook.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] hover:scale-105 transition-all duration-300"
          aria-label="Facebook"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        </a>
        <a 
          href="https://youtube.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-[#e8e8e8] flex items-center justify-center text-[#111111] hover:scale-105 transition-all duration-300"
          aria-label="YouTube"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
            <polygon points="10 15 15 12 10 9" fill="currentColor" />
          </svg>
        </a>
      </div>

      {/* Footer Navigation Bar */}
      <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 mb-8 w-full max-w-4xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className="text-[11px] uppercase tracking-[0.25em] text-primary/60 hover:text-accent transition-colors duration-300 cursor-pointer"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Copyright text, keeping 'AD Efffects' in its correct casing */}
      <div className="text-[9px] tracking-[0.25em] text-secondary/50 font-light text-center uppercase px-6">
        <span>COPYRIGHT {currentYear} </span>
        <span className="normal-case font-normal text-primary">AD Efffects</span>
        <span>. ALL RIGHTS RESERVED.</span>
      </div>

    </footer>
  );
}
