// bridge-server.js  (runs inside Replit)
import express from "express";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

/* 1) Health ping */
app.get("/health", (_, res) => res.json({ ok: true, ts: Date.now() }));

/* 2) OAuth creds for Railway */
app.get("/api/bridge/oauth-credentials", (req, res) => {
  res.json({
    clientId:     process.env.GHL_CLIENT_ID,
    clientSecret: process.env.GHL_CLIENT_SECRET,
    scopes:       "products.write medias.write",
    redirectBase: "https://dir.engageautomations.com"   // Railway host
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Bridge server running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
  console.log(`OAuth credentials: http://localhost:${PORT}/api/bridge/oauth-credentials`);
  console.log("Bridge ready to serve OAuth credentials to Railway");
});