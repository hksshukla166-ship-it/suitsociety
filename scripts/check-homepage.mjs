const base = process.argv[2] || "http://localhost:3010";

const home = await fetch(base);
console.log("home status", home.status);
const html = await home.text();
console.log("html length", html.length);

const imgUrls = [...html.matchAll(/src="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => u.includes("image") || u.includes("supabase") || u.includes("placeholder"));

console.log("image srcs in html:", imgUrls.slice(0, 20));

for (const src of imgUrls.slice(0, 8)) {
  const url = src.startsWith("http") ? src : `${base}${src}`;
  try {
    const r = await fetch(url);
    console.log("asset", r.status, r.headers.get("content-type"), url.slice(0, 100));
  } catch (e) {
    console.log("asset fail", url, e.message);
  }
}
