// We are using iTunes and Deezer APIs because the Spotify Web API now requires a Premium Subscription
// to use the search endpoints in development mode.
// iTunes is excellent for high-res album art. Deezer is great for artist images.

export async function searchSpotifyArtist(artistName: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(artistName);
    
    // Use Deezer API for artist images
    const response = await fetch(`https://api.deezer.com/search/artist?q=${query}&limit=1`);

    if (!response.ok) return null;
    
    const data = await response.json();
    const artist = data.data?.[0];
    
    if (artist && artist.picture_xl) {
      return artist.picture_xl;
    }
  } catch (err) {
    console.error("Error searching artist metadata:", err);
  }
  return null;
}

export async function searchSpotifyAlbum(albumTitle: string, artistName: string): Promise<string | null> {
  try {
    // Use iTunes API for gorgeous high-res album covers
    const query = encodeURIComponent(`${albumTitle} ${artistName}`);
    
    const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=1`);

    if (!response.ok) return null;
    
    const data = await response.json();
    const album = data.results?.[0];
    
    if (album && album.artworkUrl100) {
      // iTunes returns a 100x100 URL, but we can simply replace it with 1000x1000 for high-res
      return album.artworkUrl100.replace('100x100bb', '1000x1000bb');
    }
  } catch (err) {
    console.error("Error searching album metadata:", err);
  }
  return null;
}
