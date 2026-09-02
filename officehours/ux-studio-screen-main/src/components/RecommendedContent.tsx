'use client';

import { useRef, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { recommendations, type ContentType } from '@/config';

interface RecommendedContentProps {
  contentIndex?: number;
}

function Marquee({ children, className, speed = 40 }: { children: React.ReactNode; className?: string; speed?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [duration, setDuration] = useState(10);
  const gap = 80;

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current || !textRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const textWidth = textRef.current.offsetWidth;
      if (textWidth > containerWidth) {
        setNeedsScroll(true);
        setDuration((textWidth + gap) / speed);
      } else {
        setNeedsScroll(false);
      }
    };
    const timeout = setTimeout(measure, 100);
    return () => clearTimeout(timeout);
  }, [children, speed]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes recMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}} />
      <div ref={containerRef} style={{ overflow: 'hidden' }}>
        <div
          className={className}
          style={{
            whiteSpace: 'nowrap',
            display: 'inline-block',
            ...(needsScroll ? { animation: `recMarquee ${duration}s linear infinite` } : {}),
          }}
        >
          <span ref={textRef}>{children}</span>
          {needsScroll && (
            <span style={{ paddingLeft: `${gap}px` }} aria-hidden="true">{children}</span>
          )}
        </div>
      </div>
    </>
  );
}

export default function RecommendedContent({ contentIndex }: RecommendedContentProps) {
  const index = contentIndex ?? Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % recommendations.length;
  const content = recommendations[index];
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!content.thumbnail) return;
    setAspectRatio(null);
    const img = new Image();
    img.onload = () => setAspectRatio(img.naturalWidth / img.naturalHeight);
    img.src = content.thumbnail;
  }, [content.thumbnail]);

  const typeConfig: Record<ContentType, { emoji: string; color: string; label: string }> = {
    read: { emoji: '📖', color: 'retro-orange', label: 'READ' },
    watch: { emoji: '🎬', color: 'retro-cyan', label: 'WATCH' },
  };

  const config = typeConfig[content.type];

  return (
    <div className="flex gap-6 items-stretch">
      {/* Main Content Card */}
      <div className={`retro-card border-${config.color} p-10 flex-1`} style={{ borderColor: `var(--${config.color})` }}>
        <div className="font-[family-name:var(--font-pixel)] text-base mb-6 tracking-widest" style={{ color: `var(--${config.color})` }}>
          {config.emoji} RECOMMENDED {config.label}
        </div>

        <div className="flex gap-8 items-center">
          {/* Thumbnail */}
          {content.thumbnail && (
            <div
              className="flex-shrink-0 border-2"
              style={{
                borderColor: `var(--${config.color})`,
                height: '13rem',
                width: aspectRatio ? `${13 * aspectRatio}rem` : '10rem',
              }}
            >
              <img
                src={content.thumbnail}
                alt={content.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 140"><rect fill="%23${config.color === 'retro-orange' ? 'FF6600' : '00FFFF'}" width="100" height="140"/><text x="50" y="75" text-anchor="middle" fill="white" font-size="30">${config.emoji}</text></svg>`;
                }}
              />
            </div>
          )}

          {/* Content Info */}
          <div className="flex-1 min-w-0">
            <Marquee className="font-[family-name:var(--font-retro)] text-7xl text-white mb-4" speed={60}>
              {content.title}
            </Marquee>
            <p className="font-[family-name:var(--font-mono)] text-lg mb-5" style={{ color: `var(--${config.color})` }}>
              {content.source}
            </p>
            {content.description && (
              <Marquee className="font-[family-name:var(--font-mono)] text-lg text-white/60" speed={40}>
                {content.description}
              </Marquee>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Card */}
      {content.url && (
        <div
          className="retro-card p-8 flex flex-col items-center justify-start"
          style={{ borderColor: `var(--${config.color})` }}
        >
          <div className="font-[family-name:var(--font-pixel)] text-base tracking-widest text-center" style={{ color: `var(--${config.color})` }}>
            📱 SCAN TO {config.label}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white p-5 rounded">
              <QRCodeSVG
                value={content.url}
                size={180}
                bgColor="#ffffff"
                fgColor="#000000"
                level="M"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
