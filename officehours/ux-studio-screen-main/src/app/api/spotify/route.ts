import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Check if nowplaying-cli is installed
async function checkNowPlayingCli(): Promise<boolean> {
  try {
    await execAsync('which nowplaying-cli');
    return true;
  } catch {
    return false;
  }
}

// Get now playing using nowplaying-cli (works with Chrome, Safari, etc.)
async function getNowPlayingFromSystem(): Promise<{
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  source?: string;
} | null> {
  try {
    const hasNowPlayingCli = await checkNowPlayingCli();
    
    if (hasNowPlayingCli) {
      // Use nowplaying-cli for system-wide media info
      const { stdout } = await execAsync('nowplaying-cli get-raw');
      const data = JSON.parse(stdout);
      
      if (!data.kMRMediaRemoteNowPlayingInfoTitle) {
        return null;
      }
      
      return {
        isPlaying: data.kMRMediaRemoteNowPlayingInfoPlaybackRate > 0,
        title: data.kMRMediaRemoteNowPlayingInfoTitle || 'Unknown',
        artist: data.kMRMediaRemoteNowPlayingInfoArtist || '',
        album: data.kMRMediaRemoteNowPlayingInfoAlbum || '',
        source: data.kMRMediaRemoteNowPlayingInfoAppDisplayName || 'Unknown App',
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// Fallback: Try Spotify directly via AppleScript
async function getSpotifyNowPlaying(): Promise<{
  isPlaying: boolean;
  title?: string;
  artist?: string;
  album?: string;
  albumArt?: string;
  source: string;
} | null> {
  try {
    // Check if Spotify is running
    const { stdout: pgrep } = await execAsync('pgrep -x Spotify || true');
    if (!pgrep.trim()) return null;

    const script = `
      tell application "Spotify"
        if player state is stopped then
          return "NOT_PLAYING"
        end if
        set trackName to name of current track
        set artistName to artist of current track
        set albumName to album of current track
        set artworkUrl to artwork url of current track
        set isPlaying to player state is playing
        return trackName & "|||" & artistName & "|||" & albumName & "|||" & artworkUrl & "|||" & isPlaying
      end tell
    `;
    
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
    const result = stdout.trim();
    
    if (result === 'NOT_PLAYING') return null;
    
    const [title, artist, album, albumArt, isPlaying] = result.split('|||');
    return {
      isPlaying: isPlaying === 'true',
      title,
      artist,
      album,
      albumArt,
      source: 'Spotify',
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Try system-wide nowplaying-cli first (catches Chrome, Safari, YouTube Music, etc.)
    const systemNowPlaying = await getNowPlayingFromSystem();
    if (systemNowPlaying && systemNowPlaying.title) {
      return NextResponse.json(systemNowPlaying);
    }
    
    // Fallback to Spotify AppleScript (gets album art)
    const spotifyNowPlaying = await getSpotifyNowPlaying();
    if (spotifyNowPlaying) {
      return NextResponse.json(spotifyNowPlaying);
    }

    // Nothing playing
    return NextResponse.json({ 
      isPlaying: false, 
      status: 'Nothing playing' 
    });

  } catch (error) {
    console.error('Now Playing error:', error);
    return NextResponse.json({ 
      isPlaying: false, 
      error: 'Failed to get now playing' 
    });
  }
}
