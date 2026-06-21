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
        {!isLoading && (
          <div className="w-full">
            {children}
          </div>
        )}
      </SmoothScroll>
    </>
  );
}
