const { createClient } = require("@supabase/supabase-js");

const url = "https://hmadsihripszvgieiimc.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtYWRzaWhyaXBzenZnaWVpaW1jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIwNjg0MiwiZXhwIjoyMDk1NzgyODQyfQ.rQXmvfijWn_-ADxJdkX1RSpy2MhCIPQtu2i1G6vHlcM";

const db = createClient(url, key);

async function run() {
  const updates = [
    { old: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196803/In_The_Morning_-_Blue_Beat_Review_qepjk2.mp3", new: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", title: "In The Morning" },
    { old: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196801/Gone_Away_-_Blue_Beat_Review_sccetg.mp3", new: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", title: "Gone Away" },
    { old: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196800/I_Love_What_You_Do_To_Me_-_The_Soundlings_qhqb8j.mp3", new: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", title: "I Love What You Do To Me" },
    { old: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196799/Kuntry_Boy_-_Anno_Domini_Beats_u5t8r0.mp3", new: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", title: "Kuntry Boy" },
    { old: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196797/Halfway_In_-_Anno_Domini_Beats_fm35kh.mp3", new: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", title: "Halfway In" },
    { old: "https://res.cloudinary.com/dodgaqogz/video/upload/v1780196795/Wildfire_-_Jessie_Villa_x62op9.mp3", new: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", title: "Wildfire" }
  ];

  for (const u of updates) {
    const { data, error } = await db.from("tracks").update({ audio_url: u.new }).eq("title", u.title);
    if (error) console.error("Error updating", u.title, error);
    else console.log("Updated", u.title);
  }
}
run();
