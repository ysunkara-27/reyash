'use client';

import { useState, useEffect } from 'react';
import { scheduleConfig } from '@/config';

function getNextSession(): { start: Date; end: Date; isActive: boolean } {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHour + currentMinutes / 60;
  const endTime = scheduleConfig.endHour + scheduleConfig.endMinute / 60;

  if (scheduleConfig.days.includes(currentDay)) {
    if (currentTime >= scheduleConfig.startHour && currentTime < endTime) {
      const end = new Date(now);
      end.setHours(scheduleConfig.endHour, scheduleConfig.endMinute, 0, 0);
      return { start: now, end, isActive: true };
    }
    if (currentTime < scheduleConfig.startHour) {
      const start = new Date(now);
      start.setHours(scheduleConfig.startHour, 0, 0, 0);
      const end = new Date(now);
      end.setHours(scheduleConfig.endHour, scheduleConfig.endMinute, 0, 0);
      return { start, end, isActive: false };
    }
  }

  let daysUntilNext = 7;
  for (const day of scheduleConfig.days) {
    let diff = day - currentDay;
    if (diff <= 0) diff += 7;
    if (diff === 0 || (day === currentDay && currentTime >= endTime)) {
      diff = 7;
      for (const d of scheduleConfig.days) {
        let dd = d - currentDay;
        if (dd <= 0) dd += 7;
        if (dd < diff && dd > 0) diff = dd;
      }
    }
    if (diff < daysUntilNext) daysUntilNext = diff;
  }

  const start = new Date(now);
  start.setDate(start.getDate() + daysUntilNext);
  start.setHours(scheduleConfig.startHour, 0, 0, 0);
  
  const end = new Date(start);
  end.setHours(scheduleConfig.endHour, scheduleConfig.endMinute, 0, 0);

  return { start, end, isActive: false };
}

function formatTimeLeft(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatHour(hour: number, minute = 0): string {
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  const minutes = minute ? `:${minute.toString().padStart(2, '0')}` : '';
  return `${displayHour}${minutes}${period}`;
}

export default function Countdown() {
  const [session, setSession] = useState(getNextSession());
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      const newSession = getNextSession();
      setSession(newSession);
      
      const now = new Date();
      if (newSession.isActive) {
        setTimeLeft(newSession.end.getTime() - now.getTime());
      } else {
        setTimeLeft(newSession.start.getTime() - now.getTime());
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const isUrgent = session.isActive && timeLeft < 10 * 60 * 1000;

  return (
    <div 
      className={`retro-card p-6 h-full flex flex-col justify-center text-center transition-all duration-300 ${
        session.isActive 
          ? (isUrgent ? 'border-retro-orange animate-pulse-glow' : 'border-retro-lime')
          : 'border-retro-pink'
      }`}
      style={{ 
        color: session.isActive 
          ? (isUrgent ? 'var(--retro-orange)' : 'var(--retro-lime)') 
          : 'var(--retro-pink)' 
      }}
    >
      <div className="font-[family-name:var(--font-pixel)] text-sm mb-4 tracking-widest opacity-80">
        {session.isActive ? '⏱️ ENDS IN' : '📅 NEXT SESSION'}
      </div>
      
      <div className={`font-[family-name:var(--font-retro)] text-7xl glow-text ${isUrgent ? 'animate-glitch' : ''}`}>
        {formatTimeLeft(timeLeft)}
      </div>
      
      <div className="mt-4 font-[family-name:var(--font-mono)] text-lg opacity-60">
        {session.isActive 
          ? `Until ${formatHour(scheduleConfig.endHour, scheduleConfig.endMinute)}` 
          : `${getDayName(session.start)} @ ${formatHour(scheduleConfig.startHour)}`
        }
      </div>
    </div>
  );
}
