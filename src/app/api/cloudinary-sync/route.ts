import { NextResponse } from "next/server";

// Clean track name and parse title/artist
function cleanTrackName(filename: string) {
  // 1. Remove 6-character random alphanumeric suffix at the end (e.g., _x6ede8)
  let clean = filename.replace(/_[a-zA-Z0-9]{6}$/, "");
  
  // 2. Identify potential title/artist separators
  let title = clean;
  let artist = "Unknown Artist";
  
  const separatorRegex = /(?:\s+-\s+|_-_|\s+--\s+)/;
  if (separatorRegex.test(clean)) {
    const parts = clean.split(separatorRegex);
    title = parts[0].trim();
    artist = parts[1].trim();
  }
  
  // 3. Replace remaining underscores and hyphens with spaces
  title = title.replace(/[_-]/g, " ").trim();
  artist = artist.replace(/[_-]/g, " ").trim();
  
  // 4. Convert to Title Case
  const toTitleCase = (str: string) =>
    str
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
      
  return {
    title: toTitleCase(title) || "Untitled Track",
    artist: toTitleCase(artist) || "Unknown Artist",
  };
}

// Generate beautiful deterministic cover gradients using HSL values
function generateCoverColors(title: string, artist: string): string[] {
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };
  
  const hash = hashString(title + artist);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 120) % 360; // Complementary offset
  
  // Harmonious gradient saturation & lightness for modern aesthetics
  const color1 = `hsl(${hue1}, 75%, 55%)`;
  const color2 = `hsl(${hue2}, 70%, 40%)`;
  
  return [color1, color2];
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      // Body can be empty for auto background sync
    }

    const cloudName = body.cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = body.apiKey || process.env.CLOUDINARY_API_KEY;
    const apiSecret = body.apiSecret || process.env.CLOUDINARY_API_SECRET;
    const folder = body.folder || process.env.CLOUDINARY_FOLDER || "songs";

    if (!cloudName || !apiKey || !apiSecret || !folder || apiKey === "your_api_key_here" || apiSecret === "your_api_secret_here") {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cloudinary credentials not configured. Please supply them in the UI config form or add CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to your server's .env.local file to enable Background Auto-Sync!" 
        },
        { status: 400 }
      );
    }

    let allResources: any[] = [];
    let nextCursor: string | null = null;
    let pagesFetched = 0;

    // Call Cloudinary search endpoint to query files under the folder
    do {
      const searchBody: any = {
        expression: `folder:"${folder}*" AND resource_type:video`,
        max_results: 500,
      };

      if (nextCursor) {
        searchBody.next_cursor = nextCursor;
      }

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64"),
        },
        body: JSON.stringify(searchBody),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json(
          { success: false, error: `Cloudinary API Error: ${errorText}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      allResources = allResources.concat(data.resources || []);
      nextCursor = data.next_cursor || null;
      pagesFetched++;

      // Safety guard against infinite loops
      if (pagesFetched > 20) break;
    } while (nextCursor);

    // Format the assets into standard Soniqo Track structures
    const formattedTracks = allResources.map((res: any) => {
      const cleaned = cleanTrackName(res.filename);
      
      // Derive album from the folder path. 
      // If the resource is in 'songs/AlbumName', folder is 'songs/AlbumName'.
      // If the resource is just in 'songs', folder is 'songs'.
      const folderParts = res.folder ? res.folder.split("/") : [];
      let derivedAlbum = "Singles";
      
      // We assume the root folder is the first part (e.g. 'songs'). 
      // Anything deeper is an album name. If it's 2 levels deep, the second level is the album.
      if (folderParts.length > 1) {
        derivedAlbum = folderParts[folderParts.length - 1];
      }

      return {
        title: cleaned.title,
        artist: cleaned.artist,
        album: derivedAlbum,
        audio_url: res.secure_url,
        cover_colors: generateCoverColors(derivedAlbum, cleaned.artist), // use album name for consistent album colors
        duration_sec: Math.round(Number(res.duration || 0) * 10) / 10,
      };
    });

    if (formattedTracks.length > 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      const { error } = await supabase.from("tracks").upsert(formattedTracks, {
        onConflict: "audio_url",
      });
      
      if (error) {
        console.error("Supabase upsert error:", error);
        throw new Error("Failed to sync with database");
      }
    }

    return NextResponse.json({
      success: true,
      totalCount: formattedTracks.length,
      tracks: formattedTracks,
    });
  } catch (err: any) {
    console.error("Cloudinary Sync Server Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
