// ---------- Minimal dev server for Replit ----------
// 1. picks up Replit's injected PORT
// 2. serves Vite middleware (dev) or /dist (prod)
// 3. single catch-all route for React
//----------------------------------------------------
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

const isProd   = process.env.NODE_ENV === "production";
// Replit PORT detection with fallback
const PORT = process.env.PORT ? parseInt(process.env.PORT.toString().replace(/[^\d]/g, '')) : 5000;
console.log(`[SERVER] Starting on port ${PORT}`);

const app = express();

(async () => {
  if (isProd) {
    // ---------- production: use pre-built /dist ----------
    const dist = path.resolve("dist");
    app.use(express.static(dist));
    app.get("*", (_, res) => res.sendFile(path.join(dist, "index.html")));
  } else {
    // ---------- dev: mount Vite as middleware ----------
    const vite = await createViteServer({ server: { middlewareMode: true } });
    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      try {
        const url  = req.originalUrl;
        const html = await vite.transformIndexHtml(
          url,
          fs.readFileSync("index.html", "utf8")
        );
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) { next(e); }
    });
  }

  // ---------- simple health ping ----------
  app.get("/api/health", (_req, res) =>
    res.json({ status: "healthy", timestamp: new Date(), port: PORT })
  );

  app.listen(PORT, "0.0.0.0", () =>
    console.log(`🚀  Server running on :${PORT}`)
  );
})();