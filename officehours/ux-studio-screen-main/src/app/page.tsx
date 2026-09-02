'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Clock from '@/components/Clock';
import Countdown from '@/components/Countdown';
import Weather from '@/components/Weather';
import Announcements from '@/components/Announcements';
import NowPlaying from '@/components/NowPlaying';
import Quote from '@/components/Quote';
import FontOfTheDay from '@/components/FontOfTheDay';
import RecommendedContent from '@/components/RecommendedContent';
import { quotes, fonts, recommendations } from '@/config';

// Rotating content components (carousel)
const rotatingContent = [
  { id: 'nowplaying', component: NowPlaying, label: 'MUSIC' },
  { id: 'quote', component: Quote, label: 'QOTD' },
  { id: 'font', component: FontOfTheDay, label: 'FOTD' },
  { id: 'recommended', component: RecommendedContent, label: 'RECS' },
];

// Calculate how long a slide should stay based on its text content
// ~200 words per minute reading speed, with a minimum of 8s and max of 25s
function getSlideDuration(slideId: string): number {
  const MIN_MS = 8000;
  const MAX_MS = 25000;
  const MS_PER_WORD = 300; // 200wpm = 300ms per word

  let text = '';
  switch (slideId) {
    case 'nowplaying':
      // Music slide is mostly visual, short duration
      return MIN_MS;
    case 'quote': {
      const q = quotes[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % quotes.length];
      text = `${q.text} ${q.author} ${q.role ?? ''}`;
      break;
    }
    case 'font': {
      const f = fonts[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % fonts.length];
      text = `${f.name} ${f.designer} ${f.funFact} ${f.sampleText ?? ''}`;
      break;
    }
    case 'recommended': {
      const r = recommendations[Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % recommendations.length];
      text = `${r.title} ${r.source} ${r.description ?? ''}`;
      break;
    }
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const duration = wordCount * MS_PER_WORD;
  return Math.max(MIN_MS, Math.min(MAX_MS, duration));
}

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const advance = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % rotatingContent.length;
        return next;
      });
      setIsTransitioning(false);
    }, 500);
  }, []);

  // Schedule next slide based on current slide's content
  useEffect(() => {
    const slideId = rotatingContent[currentIndex].id;
    const duration = getSlideDuration(slideId);
    timerRef.current = setTimeout(advance, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex, advance]);

  const CurrentComponent = rotatingContent[currentIndex].component;

  return (
    <div className="h-screen w-screen overflow-hidden bg-background bg-grid p-6 flex flex-col">
      {/* Header */}
      <header className="text-center mb-6 flex-shrink-0">
        <h1 className="font-[family-name:var(--font-pixel)] text-3xl text-retro-pink glow-text tracking-wider animate-float">
          ✨ UX STUDIO ✨
        </h1>
      </header>

      {/* Persistent Top Row: Clock, Weather, Countdown, Announcements */}
      <div className="flex-shrink-0 grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-4">
          <Clock />
        </div>
        <div className="col-span-2">
          <Weather />
        </div>
        <div className="col-span-2">
          <Countdown />
        </div>
        <div className="col-span-4">
          <Announcements />
        </div>
      </div>

      {/* Rotating Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Progress Indicator */}
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center gap-4 mb-4">
          {rotatingContent.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setIsTransitioning(true);
                setTimeout(() => {
                  setCurrentIndex(index);
                  setIsTransitioning(false);
                }, 300);
              }}
              className={`px-6 py-3 text-base font-[family-name:var(--font-pixel)] transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-retro-pink text-black scale-110'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Content with fade animation */}
        <div 
          className={`h-full pt-16 transition-all duration-500 ease-in-out ${
            isTransitioning 
              ? 'opacity-0 transform translate-y-4' 
              : 'opacity-100 transform translate-y-0'
          }`}
        >
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-7xl">
              <CurrentComponent />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 text-center mt-4 font-[family-name:var(--font-mono)] text-xs text-white">
        Made with 💜 for HCI UX Studio
      </footer>
    </div>
  );
}
