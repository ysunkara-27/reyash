'use client';

import { QRCodeSVG } from 'qrcode.react';
import { musicConfig } from '@/config';

export default function NowPlaying() {
  return (
    <div className="flex gap-6 items-stretch">
      <div className="retro-card border-retro-lime p-8 flex-1">
        <div className="font-[family-name:var(--font-pixel)] text-base text-retro-lime mb-5 tracking-widest">
          🎵 OFFICE HOURS PLAYLIST
        </div>
        <iframe
          src={musicConfig.spotifyEmbedUrl}
          title="Office hours Spotify playlist"
          width="100%"
          height="352"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl border-0"
        />
      </div>

      <div
        className="retro-card p-8 flex flex-col items-center justify-start flex-shrink-0"
        style={{ borderColor: `var(--${musicConfig.color})` }}
      >
        <div className="font-[family-name:var(--font-pixel)] text-base tracking-widest text-center" style={{ color: `var(--${musicConfig.color})` }}>
          📱 {musicConfig.label}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white p-5 rounded">
            <QRCodeSVG value={musicConfig.spotifyPlaylistUrl} size={180} bgColor="#ffffff" fgColor="#000000" level="M" />
          </div>
        </div>
      </div>
    </div>
  );
}
