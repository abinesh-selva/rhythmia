const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching all playlists...");
  const { data: playlists, error: errPl } = await supabase
    .from('playlists')
    .select('id, name');
  
  if (errPl) {
    console.error(errPl);
    return;
  }

  for (const pl of playlists || []) {
    const { data: plTracks, error: errPlT } = await supabase
      .from('playlist_tracks')
      .select('track_id, tracks(id, title, is_active)')
      .eq('playlist_id', pl.id);
    
    if (errPlT) {
      console.error(errPlT);
      continue;
    }

    const total = plTracks.length;
    const active = plTracks.filter(t => t.tracks && t.tracks.is_active).length;
    const inactive = plTracks.filter(t => t.tracks && !t.tracks.is_active).length;
    const missing = plTracks.filter(t => !t.tracks).length;

    console.log(`Playlist "${pl.name}" (${pl.id}):`);
    console.log(`  Total linked tracks: ${total}`);
    console.log(`  Active tracks: ${active}`);
    console.log(`  Inactive tracks: ${inactive}`);
    console.log(`  Missing/deleted tracks: ${missing}`);
    
    if (inactive > 0) {
      console.log("  Inactive tracks details:");
      plTracks.filter(t => t.tracks && !t.tracks.is_active).forEach(t => {
        console.log(`    - ID: ${t.tracks.id}, Title: ${t.tracks.title}`);
      });
    }
  }

  console.log("\nFetching Liked Songs count...");
  const { data: likes, error: errLikes } = await supabase
    .from('likes')
    .select('track_id, tracks(id, title, is_active)');
  
  if (errLikes) {
    console.error(errLikes);
  } else {
    const total = likes.length;
    const active = likes.filter(l => l.tracks && l.tracks.is_active).length;
    const inactive = likes.filter(l => l.tracks && !l.tracks.is_active).length;
    const missing = likes.filter(l => !l.tracks).length;
    console.log(`Liked Songs:`);
    console.log(`  Total likes: ${total}`);
    console.log(`  Active: ${active}`);
    console.log(`  Inactive: ${inactive}`);
    console.log(`  Missing/deleted tracks: ${missing}`);
  }
}

run();
