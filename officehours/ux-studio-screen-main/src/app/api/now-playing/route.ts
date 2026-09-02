import { NextResponse } from 'next/server';

// In-memory store for now playing data (persists across requests)
let nowPlayingData: {
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  source?: string;
  timestamp?: number;
} = { isPlaying: false };

// SSE clients waiting for updates
const clients: Set<ReadableStreamDefaultController> = new Set();

// Data is considered stale after 10 seconds (extension sends every 3s)
const STALE_THRESHOLD = 10000;

// CORS headers for the Chrome extension
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Broadcast update to all SSE clients
function broadcastUpdate() {
  const data = JSON.stringify(nowPlayingData);
  clients.forEach((controller) => {
    try {
      controller.enqueue(`data: ${data}\n\n`);
    } catch {
      clients.delete(controller);
    }
  });
}

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// POST: Receive data from Chrome extension
export async function POST(request: Request) {
  try {
    const data = await request.json();
    nowPlayingData = {
      isPlaying: data.isPlaying ?? false,
      title: data.title,
      artist: data.artist,
      album: data.album,
      albumArt: data.albumArt,
      source: data.source || 'YouTube Music',
      timestamp: data.timestamp || Date.now(),
    };
    
    console.log('Now Playing received:', nowPlayingData.title, 'by', nowPlayingData.artist, '| Playing:', nowPlayingData.isPlaying);
    
    // Broadcast to all SSE clients
    broadcastUpdate();
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Now Playing POST error:', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400, headers: corsHeaders });
  }
}

// GET: Return SSE stream or current data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get('stream');

  // If stream=true, return SSE stream
  if (stream === 'true') {
    const encoder = new TextEncoder();
    const responseStream = new ReadableStream({
      start(controller) {
        clients.add(controller);
        
        // Send initial data immediately
        const initialData = JSON.stringify(nowPlayingData);
        controller.enqueue(encoder.encode(`data: ${initialData}\n\n`));
        
        // Keep-alive ping every 30s
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          } catch {
            clearInterval(keepAlive);
            clients.delete(controller);
          }
        }, 30000);
      },
      cancel(controller) {
        clients.delete(controller);
      }
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders,
      },
    });
  }

  // Regular GET - return current data
  const isStale = Date.now() - (nowPlayingData.timestamp || 0) > STALE_THRESHOLD;
  
  if (isStale) {
    return NextResponse.json({
      isPlaying: false,
      status: 'No active source',
    }, { headers: corsHeaders });
  }
  
  return NextResponse.json(nowPlayingData, { headers: corsHeaders });
}
