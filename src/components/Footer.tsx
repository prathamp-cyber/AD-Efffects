'use client';

interface FooterProps {
  onTabChange?: (tab: string) => void;
}

export default function Footer({ onTabChange }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="w-full bg-white flex flex-col items-center border-t border-[#111111]/20"
      style={{ paddingTop: '80px', paddingBottom: '60px' }}
    >
      
      {/* Logo: Brand name cursive logo matching the header */}
      <div 
        className="flex flex-col items-center relative select-none"
        style={{ marginBottom: '40px' }} // Spacing to the paragraph
      >
        <button 
          onClick={() => onTabChange?.('portfolio')}
          className="font-script text-[64px] text-primary leading-none focus:outline-none cursor-pointer hover:opacity-75 transition-opacity"
        >
          AD Efffects
        </button>
        {/* Centered horizontal underline */}
        <div className="w-[180px] h-[1px] bg-primary mt-3" />
      </div>

      {/* Brand Paragraph: Relevant, elegant, centered spatial statement */}
      <p 
        className="font-cormorant font-light text-[15px] md:text-[16px] text-secondary/80 leading-[1.8] text-center max-w-[500px] px-6"
        style={{ marginBottom: '48px' }} // Spacing to copyright line
      >
        A design studio dedicated to spatial purity and material honesty. We create thoughtfully crafted, enduring sanctuaries shaped around the people who live within them.
      </p>

      {/* Copyright text, keeping 'AD Efffects' in its correct casing */}
      <div className="text-[9px] tracking-[0.35em] text-secondary/50 font-light text-center uppercase px-6">
        <span className="mr-[-0.35em]">
          <span>COPYRIGHT {currentYear} </span>
          <span className="normal-case font-normal text-primary">AD Efffects</span>
          <span>. ALL RIGHTS RESERVED.</span>
        </span>
      </div>

    </footer>
  );
}
