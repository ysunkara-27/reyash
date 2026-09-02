import { NextResponse } from 'next/server';

// Cache images for 1 hour
const imageCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Check cache first
  const cached = imageCache.get(imageUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return new NextResponse(new Uint8Array(cached.data), {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  try {
    // Fetch the image from Google
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('Image proxy: Failed to fetch image', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Cache the image
    imageCache.set(imageUrl, { data: buffer, contentType, timestamp: Date.now() });

    // Clean up old cache entries (keep only last 50 images)
    if (imageCache.size > 50) {
      const entries = Array.from(imageCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, entries.length - 50).forEach(([key]) => imageCache.delete(key));
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Image proxy: Error fetching image', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
