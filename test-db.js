require("dotenv").config({ path: ".env.local" });
async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/rest/v1/artists?select=id,display_name,image&limit=5`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  console.log("Artists:", await res.json());

  const res2 = await fetch(`${url}/rest/v1/albums?select=id,title,cover_image&limit=5`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    }
  });
  console.log("Albums:", await res2.json());
}
run();
