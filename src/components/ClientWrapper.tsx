'use client';

import { useState } from 'react';
import LoadingScreen from './LoadingScreen';
import SmoothScroll from './SmoothScroll';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <LoadingScreen onComplete={() => setIsLoading(false)} />
      <SmoothScroll>
        <div 
          className="transition-opacity duration-1000 ease-out" 
          style={{ opacity: isLoading ? 0 : 1 }}
        >
          {children}
        </div>
      </SmoothScroll>
    </>
  );
}
