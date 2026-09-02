'use client';

import { announcements, type Announcement, type AnnouncementType } from '@/config';

const typeConfig: Record<AnnouncementType, { emoji: string; color: string }> = {
  homework: { emoji: '📝', color: 'retro-orange' },
  project: { emoji: '🚀', color: 'retro-pink' },
  quiz: { emoji: '❓', color: 'retro-blue' },
  exam: { emoji: '📋', color: 'retro-purple' },
  ica: { emoji: '👥', color: 'retro-green' },
  lab: { emoji: '🔬', color: 'retro-yellow' },
  survey: { emoji: '📊', color: 'retro-pink' },
  checkpoint: { emoji: '📍', color: 'retro-cyan' },
};

function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return 'PAST';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 7) return `${Math.floor(days / 7)}w`;
  if (days > 0) return `${days}d`;
  return `${hours}h`;
}

export default function Announcements() {
  const upcomingAnnouncements = announcements
    .filter(d => d.date.getTime() > Date.now())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  const isUrgent = (date: Date) => {
    const diff = date.getTime() - Date.now();
    return diff < 48 * 60 * 60 * 1000;
  };

  return (
    <div className="retro-card border-retro-yellow p-6 h-full flex flex-col justify-center">
      <div className="font-[family-name:var(--font-pixel)] text-sm text-retro-yellow mb-4 tracking-widest">
        📢 ANNOUNCEMENTS
      </div>
      
      <div className="space-y-2">
        {upcomingAnnouncements.length === 0 ? (
          <div className="font-[family-name:var(--font-mono)] text-white/50 text-center text-lg">
            No announcements! 🎉
          </div>
        ) : (
          upcomingAnnouncements.map((announcement, i) => {
            const config = typeConfig[announcement.type];
            const urgent = isUrgent(announcement.date);
            
            return (
              <div 
                key={i}
                className={`flex items-center gap-3 text-lg ${urgent ? 'animate-pulse' : ''}`}
              >
                <span className="text-2xl">{config.emoji}</span>
                <span className="font-[family-name:var(--font-mono)] text-white/80 flex-1 truncate">
                  {announcement.title}
                </span>
                <span 
                  className={`font-[family-name:var(--font-retro)] text-3xl font-bold ${
                    urgent ? 'text-retro-orange' : 'text-white/50'
                  }`}
                >
                  {formatTimeUntil(announcement.date)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
