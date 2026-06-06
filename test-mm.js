const url = "https://res.cloudinary.com/soniqo/video/upload/v1780319652/11Ninaivu_Chinnam..Qurukulie_frmfyz.mp3";
(async () => {
  const start = Date.now();
  console.log("Fetching...");
  try {
    const res = await fetch(url, {
      headers: { Range: "bytes=0-262143" },
      signal: AbortSignal.timeout(8000),
    });
    console.log("Fetched in", Date.now() - start);
    const buf = new Uint8Array(await res.arrayBuffer());
    console.log("Buffer created in", Date.now() - start, "size:", buf.length);
    const mm = await import("music-metadata");
    console.log("music-metadata imported in", Date.now() - start);
    const meta = await mm.parseBuffer(buf, "audio/mpeg", { skipCovers: true });
    console.log("Parsed meta:", meta.common.title, "in", Date.now() - start);
  } catch (err) {
    console.error("Error", err);
  }
})();
