// Simple static file server for development
// Run: bun serve.ts

const server = Bun.serve({
  port: 4141,
  async fetch(req) {
    const url = new URL(req.url);
    let path = url.pathname;

    if (path === "/") path = "/index.html";

    const file = Bun.file(`.${path}`);
    if (await file.exists()) {
      return new Response(file);
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`🐟 LinkedFin running at http://localhost:${server.port}`);
