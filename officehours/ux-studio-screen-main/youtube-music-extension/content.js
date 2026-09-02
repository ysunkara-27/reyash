// YouTube Music Now Playing - Content Script
// Reads current track info from the DOM and sends to local server

const API_URL = 'http://localhost:3000/api/now-playing';
const UPDATE_INTERVAL = 3000; // 3 seconds

function getNowPlaying() {
  try {
    // Use the verified selectors for YouTube Music
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (!playerBar) {
      console.log('YouTube Music Extension: Player bar not found');
      return null;
    }

    const titleEl = playerBar.querySelector('.title');
    const artistEl = playerBar.querySelector('.byline a'); // First link is the artist
    
    // Try to get album art from YouTube Music's internal data
    let albumArt = null;
    
    // Method 1: Try to get from the player's internal data
    try {
      const ytmusic = document.querySelector('ytmusic-app-layout');
      if (ytmusic && ytmusic.__data && ytmusic.__data.playerResponse) {
        const videoDetails = ytmusic.__data.playerResponse.videoDetails;
        if (videoDetails && videoDetails.thumbnail && videoDetails.thumbnail.thumbnails) {
          const thumbnails = videoDetails.thumbnail.thumbnails;
          // Get the highest resolution thumbnail
          const highestRes = thumbnails[thumbnails.length - 1];
          albumArt = highestRes.url;
          console.log('YouTube Music Extension: Got album art from player data');
        }
      }
    } catch (e) {
      console.log('YouTube Music Extension: Could not get from player data', e.message);
    }
    
    // Method 2: Try to get from the queue/player API
    if (!albumArt) {
      try {
        const playerPage = document.querySelector('ytmusic-player-page');
        if (playerPage && playerPage.playerResponse_) {
          const thumbnails = playerPage.playerResponse_.videoDetails?.thumbnail?.thumbnails;
          if (thumbnails && thumbnails.length > 0) {
            const highestRes = thumbnails[thumbnails.length - 1];
            albumArt = highestRes.url;
            console.log('YouTube Music Extension: Got album art from player page');
          }
        }
      } catch (e) {
        console.log('YouTube Music Extension: Could not get from player page', e.message);
      }
    }
    
    // Method 3: Fallback to DOM scraping with improved selectors
    if (!albumArt) {
      const albumArtEl = 
        document.querySelector('#song-image img') ||  // Full player image with complete URL (most reliable!)
        document.querySelector('ytmusic-player #song-image img') ||
        playerBar.querySelector('img.style-scope.ytmusic-player-bar') ||
        playerBar.querySelector('.thumbnail-image-wrapper img') ||
        document.querySelector('ytmusic-player .thumbnail img') ||
        document.querySelector('#player img.image');
      
      if (albumArtEl) {
        let srcUrl = albumArtEl.getAttribute('src') || albumArtEl.src;
        
        // Check srcset for better quality
        const srcset = albumArtEl.getAttribute('srcset');
        if (srcset) {
          const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
          if (urls.length > 0) {
            srcUrl = urls[urls.length - 1];
          }
        }
        
        if (srcUrl && srcUrl.startsWith('http')) {
          // The #song-image already has proper size params, use as-is
          albumArt = srcUrl;
          console.log('YouTube Music Extension: Got album art from DOM');
        }
      }
    }
    
    console.log('YouTube Music Extension: Final album art URL -', albumArt?.substring(0, 100));
    
    const playButton = playerBar.querySelector('#play-pause-button');
    
    // Check if playing - try multiple methods
    const ariaLabel = playButton?.getAttribute('aria-label') || '';
    const titleAttr = playButton?.getAttribute('title') || '';
    // When playing, the button shows "Pause" (to pause). When paused, it shows "Play" (to play)
    const isPlaying = ariaLabel.toLowerCase().includes('pause') || 
                      titleAttr.toLowerCase().includes('pause') ||
                      playButton?.classList.contains('playing');
    
    const title = titleEl?.textContent?.trim() || null;
    const artist = artistEl?.textContent?.trim() || null;
    
    // Try to get album name from the second link in byline
    const bylineLinks = playerBar.querySelectorAll('.byline a');
    const album = bylineLinks.length > 1 ? bylineLinks[1]?.textContent?.trim() : null;

    console.log('YouTube Music Extension: Found track -', title, 'by', artist, '| Playing:', isPlaying, '| Has Art:', !!albumArt);

    return {
      isPlaying: isPlaying,
      title,
      artist,
      album,
      albumArt,
      source: 'YouTube Music',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('YouTube Music Extension: Error getting now playing', error);
    return null;
  }
}

async function sendNowPlaying() {
  const data = getNowPlaying();
  
  if (!data || !data.title) {
    // Nothing playing, still send update so server knows
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPlaying: false, source: 'YouTube Music', timestamp: Date.now() })
      });
    } catch (e) {
      // Server might not be running, ignore
    }
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (response.ok) {
      console.log('YouTube Music Extension: Sent now playing -', data.title);
    } else {
      console.error('YouTube Music Extension: Server error', response.status);
    }
  } catch (error) {
    console.error('YouTube Music Extension: Failed to send -', error.message);
  }
}

// Start sending updates
console.log('YouTube Music Extension: Starting... will send updates to', API_URL);
sendNowPlaying(); // Send immediately
setInterval(sendNowPlaying, UPDATE_INTERVAL);

// Also send when visibility changes (tab becomes active)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('YouTube Music Extension: Tab became visible, sending update');
    sendNowPlaying();
  }
});

// Also listen for player state changes
const observer = new MutationObserver(() => {
  sendNowPlaying();
});

// Start observing once player bar is available
function startObserver() {
  const playerBar = document.querySelector('ytmusic-player-bar');
  if (playerBar) {
    observer.observe(playerBar, { subtree: true, childList: true, attributes: true });
    console.log('YouTube Music Extension: Started observing player bar');
  } else {
    setTimeout(startObserver, 1000);
  }
}
startObserver();
