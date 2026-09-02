'use client';

import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  const dateStr = time.toLocaleDateString('en-US', dateOptions);

  return (
    <div className="retro-card border-retro-cyan p-6 h-full flex flex-col justify-center text-center">
      <div className="font-[family-name:var(--font-pixel)] text-sm text-retro-cyan mb-4 tracking-widest">
        🕐 CURRENT TIME
      </div>
      
      <div className="font-[family-name:var(--font-retro)] text-7xl text-retro-cyan glow-text tracking-wider">
        {timeStr}
      </div>
      
      <div className="mt-4 font-[family-name:var(--font-mono)] text-lg text-white/60">
        {dateStr}
      </div>
    </div>
  );
}
