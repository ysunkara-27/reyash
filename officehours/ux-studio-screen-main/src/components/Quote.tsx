'use client';

import { quotes } from '@/config';

interface QuoteProps {
  quoteIndex?: number;
}

export default function Quote({ quoteIndex }: QuoteProps) {
  // Use day of year to rotate quotes if no index provided
  const index = quoteIndex ?? Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % quotes.length;
  const quote = quotes[index];

  return (
    <div className="retro-card border-retro-purple p-10">
      <div className="font-[family-name:var(--font-pixel)] text-base text-retro-purple mb-8 tracking-widest">
        💭 QUOTE OF THE DAY
      </div>
      
      <blockquote className="relative">
        <span className="absolute -top-6 -left-3 text-9xl text-retro-purple/30 font-serif">"</span>
        <p className="font-[family-name:var(--font-retro)] text-7xl text-white leading-relaxed pl-10">
          {quote.text}
        </p>
        <span className="absolute -bottom-6 right-0 text-9xl text-retro-purple/30 font-serif">"</span>
      </blockquote>
      
      <footer className="mt-10 pl-10">
        <cite className="not-italic">
          <span className="font-[family-name:var(--font-mono)] text-3xl text-retro-purple font-bold">
            — {quote.author}
          </span>
          {quote.role && (
            <span className="font-[family-name:var(--font-mono)] text-lg text-white/50 ml-4">
              {quote.role}
            </span>
          )}
        </cite>
      </footer>
    </div>
  );
}
