require("dotenv").config({ path: ".env.local" });
async function run() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  
  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  
  const tokenData = await tokenRes.json();
  console.log("Token generated:", !!tokenData.access_token);

  const searchRes = await fetch("https://api.spotify.com/v1/search?q=Eminem&type=artist&limit=1", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  
  console.log("Search Status:", searchRes.status);
  console.log("Search Body:", await searchRes.text());
}
run();
