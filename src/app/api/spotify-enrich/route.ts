import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { searchSpotifyArtist, searchSpotifyAlbum } from "@/lib/spotify";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role credentials not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST() {
  try {
    const db = getServiceClient();
    let artistsUpdated = 0;
    let albumsUpdated = 0;

    // 1. Fetch artists with missing images
    const { data: artists, error: artErr } = await db
      .from("artists")
      .select("id, display_name")
      .is("image", null)
      .limit(50); // limit to avoid rate limits

    if (artErr) throw new Error(`Artist fetch error: ${artErr.message}`);

    // Enrich artists
    if (artists && artists.length > 0) {
      for (const artist of artists) {
        const imageUrl = await searchSpotifyArtist(artist.display_name);
        if (imageUrl) {
          const { error: updateErr } = await db
            .from("artists")
            .update({ image: imageUrl })
            .eq("id", artist.id);
          
          if (!updateErr) {
            artistsUpdated++;
          }
        }
      }
    }

    // 2. Fetch albums with missing covers
    // We also need the artist name to search effectively, so we join artists
    const { data: albums, error: albErr } = await db
      .from("albums")
      .select("id, title, artists(display_name)")
      .is("cover_image", null)
      .limit(50); // limit to avoid rate limits

    if (albErr) throw new Error(`Album fetch error: ${albErr.message}`);

    // Enrich albums
    if (albums && albums.length > 0) {
      for (const album of albums) {
        const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
        const artistName = artistInfo?.display_name || "";
        
        const coverUrl = await searchSpotifyAlbum(album.title, artistName);
        if (coverUrl) {
          const { error: updateErr } = await db
            .from("albums")
            .update({ cover_image: coverUrl })
            .eq("id", album.id);
          
          if (!updateErr) {
            albumsUpdated++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      artistsUpdated,
      albumsUpdated,
      message: `Enriched ${artistsUpdated} artists and ${albumsUpdated} albums with iTunes & Deezer metadata.`
    });

  } catch (err: any) {
    console.error("[spotify-enrich]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
