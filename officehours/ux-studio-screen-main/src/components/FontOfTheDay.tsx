'use client';

import { fonts } from '@/config';
import { useEffect, useState } from 'react';

interface FontOfTheDayProps {
  fontIndex?: number;
}

export default function FontOfTheDay({ fontIndex }: FontOfTheDayProps) {
  // Use day of year to rotate fonts
  const dayNumber = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const index = fontIndex ?? dayNumber % fonts.length;
  const font = fonts[index];
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    const fontFamily = font.name;
    const cssUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}&display=swap`;

    // Check if this font's stylesheet is already in the head
    if (document.querySelector(`link[href="${cssUrl}"]`)) {
      document.fonts.ready.then(() => setFontLoaded(true));
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssUrl;
    document.head.appendChild(link);

    link.onload = () => {
      document.fonts.ready.then(() => setFontLoaded(true));
    };
  }, [font.name]);

  return (
    <div className="retro-card border-retro-yellow p-8">
      
      <div className="font-[family-name:var(--font-pixel)] text-sm text-retro-yellow mb-5 tracking-widest">
        🔤 FONT OF THE DAY
      </div>
      
      {/* Font Name */}
      <h3
        className="text-6xl text-white mb-3 glow-text transition-opacity duration-300"
        style={{ fontFamily: fontLoaded ? font.name : undefined, color: 'var(--retro-yellow)', opacity: fontLoaded ? 1 : 0.5 }}
      >
        {font.name}
      </h3>
      
      {/* Designer & Year */}
      <div className="font-[family-name:var(--font-mono)] text-base text-white/60 mb-5">
        by {font.designer} • {font.year}
      </div>
      
      {/* Sample Text */}
      <div
        className="bg-black/30 p-6 border-2 border-retro-yellow/30 mb-5 transition-opacity duration-300"
        style={{ fontFamily: fontLoaded ? font.name : undefined, opacity: fontLoaded ? 1 : 0.5 }}
      >
        <p className="text-3xl text-white">{font.sampleText}</p>
        <p className="text-3xl text-white font-bold mt-3">{font.sampleText}</p>
      </div>
      
      {/* Character Set Preview */}
      <div
        className="text-base text-white/40 break-all transition-opacity duration-300"
        style={{ fontFamily: fontLoaded ? font.name : undefined, opacity: fontLoaded ? 1 : 0.5 }}
      >
        Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz
        <br />
        0 1 2 3 4 5 6 7 8 9 @ # $ % & * ! ?
      </div>
      
      {/* Fun Fact */}
      <div className="mt-5 p-4 bg-retro-yellow/10 border-l-4 border-retro-yellow">
        <p className="font-[family-name:var(--font-mono)] text-base text-white/80">
          💡 {font.funFact}
        </p>
      </div>
    </div>
  );
}
