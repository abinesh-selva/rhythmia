const start = Date.now();
fetch("http://localhost:3000/api/cloudinary-sync", { method: "POST" })
  .then(r => r.json())
  .then(d => console.log(d, `Took ${Date.now() - start}ms`))
  .catch(e => console.error("Error", e));
