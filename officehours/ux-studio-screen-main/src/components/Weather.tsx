'use client';

import { useState, useEffect } from 'react';
import { weatherConfig } from '@/config';

// Weather icons mapping
const weatherIcons: Record<string, string> = {
  'sunny': '☀️',
  'clear': '☀️',
  'partly cloudy': '⛅',
  'cloudy': '☁️',
  'overcast': '☁️',
  'mist': '🌫️',
  'fog': '🌫️',
  'light rain': '🌦️',
  'rain': '🌧️',
  'heavy rain': '🌧️',
  'thunderstorm': '⛈️',
  'snow': '❄️',
  'light snow': '🌨️',
  'sleet': '🌨️',
  'default': '🌡️',
};

function getWeatherIcon(condition: string): string {
  const lower = condition.toLowerCase();
  for (const [key, icon] of Object.entries(weatherIcons)) {
    if (lower.includes(key)) return icon;
  }
  return weatherIcons.default;
}

interface WeatherData {
  temperature: number;
  condition: string;
  feelsLike: number;
}

const CACHE_KEY = 'weather_cache';

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function getCachedWeather(): WeatherData | null {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        
        const { data, timestamp }: CachedWeather = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > weatherConfig.cacheDurationMs;
        
        if (isExpired) {
          localStorage.removeItem(CACHE_KEY);
          return null;
        }
        
        return data;
      } catch {
        return null;
      }
    }

    function setCachedWeather(data: WeatherData) {
      const cache: CachedWeather = { data, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }

    async function fetchWeather() {
      // Check cache first
      const cached = getCachedWeather();
      if (cached) {
        setWeather(cached);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://wttr.in/${weatherConfig.location},${weatherConfig.state}?format=j1`
        );
        const data = await response.json();
        
        const current = data.current_condition[0];
        const weatherData: WeatherData = {
          temperature: parseInt(current.temp_F),
          condition: current.weatherDesc[0].value,
          feelsLike: parseInt(current.FeelsLikeF),
        };
        
        setWeather(weatherData);
        setCachedWeather(weatherData);
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        setWeather({ temperature: 45, condition: 'Unknown', feelsLike: 42 });
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Check every hour if cache needs refresh
    const interval = setInterval(fetchWeather, weatherConfig.cacheDurationMs);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="retro-card border-retro-blue p-6 h-full flex flex-col justify-center text-center">
      <div className="font-[family-name:var(--font-pixel)] text-sm text-retro-blue mb-4 tracking-widest">
        🌤️ WEATHER
      </div>
      
      {loading ? (
        <div className="font-[family-name:var(--font-retro)] text-4xl text-retro-blue animate-pulse">
          ...
        </div>
      ) : weather ? (
        <>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl">{getWeatherIcon(weather.condition)}</span>
            <div className="font-[family-name:var(--font-retro)] text-7xl text-retro-blue glow-text">
              {weather.temperature}°
            </div>
          </div>
          <div className="mt-4 font-[family-name:var(--font-mono)] text-lg text-white/50">
            {weatherConfig.location}
          </div>
        </>
      ) : null}
    </div>
  );
}
