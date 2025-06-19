// index.js – GoHighLevel proxy with automatic token‑refresh + media upload
// 18 Jun 2025 – full file, syntax‑checked

const express  = require('express');
const cors     = require('cors');
const axios    = require('axios');
const multer   = require('multer');
const FormData = require('form-data');
const fs       = require('fs');

const app  = express();
const port = process.env.PORT || 3000;

// ───────────────────────────────────────────────────────
// Middleware
// ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ───────────────────────────────────────────────────────
// In‑memory install store (swap for DB/Redis in prod)
// ───────────────────────────────────────────────────────
const installations = new Map();

if (process.env.GHL_ACCESS_TOKEN) {
  installations.set('install_seed', {
    id: 'install_seed',
    accessToken:  process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN || null,
    expiresIn:    86399,
    expiresAt:    Date.now() + 86399 * 1000,
    locationId:   process.env.GHL_LOCATION_ID || 'WAvk87RmW9rBSDJHeOpH',
    scopes:       process.env.GHL_SCOPES || 'medias.write medias.readonly',
    tokenStatus:  'valid',
    createdAt:    new Date().toISOString()
  });
}

// ───────────────────────────────────────────────────────
// TOKEN LIFECYCLE HELPERS
// ───────────────────────────────────────────────────────
const PADDING_MS  = 5 * 60 * 1000;        // refresh 5 min early
const refreshers  = new Map();            // installId → timer id

async function refreshAccessToken (id) {
  const inst = installations.get(id);
  if (!inst || !inst.refreshToken) return;

  try {
    const body = new URLSearchParams({
      client_id:     process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type:    'refresh_token',
      refresh_token: inst.refreshToken
    });

    const { data } = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );

    inst.accessToken  = data.access_token;
    inst.refreshToken = data.refresh_token || inst.refreshToken;
    inst.expiresIn    = data.expires_in;
    inst.expiresAt    = Date.now() + data.expires_in * 1000;
    inst.tokenStatus  = 'valid';

    scheduleRefresh(id);
    console.log(`[REFRESH] ${id} → ${(data.expires_in/3600).toFixed(1)} h`);
  } catch (err) {
    console.error(`[REFRESH‑FAIL] ${id}`, err.response?.data || err.message);
    inst.tokenStatus = 'invalid';
  }
}

function scheduleRefresh (id) {
  clearTimeout(refreshers.get(id));
  const inst = installations.get(id);
  if (!inst || !inst.expiresAt) return;
  const delay = Math.max(inst.expiresAt - Date.now() - PADDING_MS, 0);
  const t = setTimeout(() => refreshAccessToken(id), delay);
  refreshers.set(id, t);
}

async function ensureFreshToken (id) {
  const inst = installations.get(id);
  if (!inst) throw new Error('Unknown installation');
  if (!inst.expiresAt || inst.expiresAt - Date.now() < PADDING_MS) {
    await refreshAccessToken(id);
  }
  if (inst.tokenStatus !== 'valid') throw new Error('Token invalid');
}

// ───────────────────────────────────────────────────────
// Helper: validate installation on each request
// ───────────────────────────────────────────────────────
function requireInstall (req, res) {
  const installationId = req.method === 'GET' ? req.query.installation_id : req.body.installation_id;
  const inst = installations.get(installationId);
  if (!inst || !inst.accessToken) {
    res.status(400).json({ success:false, error:`Installation not found: ${installationId}` });
    return null;
  }
  return inst;
}

// ───────────────────────────────────────────────────────
// BASIC ROUTES
// ───────────────────────────────────────────────────────
app.get('/', (req, res)=>{
  res.json({ service:'GHL proxy', version:'1.4.0', ts:new Date().toISOString(), installs:installations.size });
});
app.get('/health', (req,res)=>{
  res.json({ status:'ok', ts:new Date().toISOString() });
});

// ───────────────────────────────────────────────────────
// OAUTH ENDPOINTS
// ───────────────────────────────────────────────────────
async function exchangeCode (code, redirectUri) {
  const body = new URLSearchParams({
    client_id:     process.env.GHL_CLIENT_ID,
    client_secret: process.env.GHL_CLIENT_SECRET,
    grant_type:    'authorization_code',
    code,
    redirect_uri:  redirectUri
  });
  const { data } = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, { headers:{'Content-Type':'application/x-www-form-urlencoded'}, timeout:15000 });
  return data;
}

function storeInstall (tokenData) {
  const id = `install_${Date.now()}`;
  installations.set(id, {
    id,
    accessToken:  tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn:    tokenData.expires_in,
    expiresAt:    Date.now() + tokenData.expires_in * 1000,
    locationId:   tokenData.locationId || 'WAvk87RmW9rBSDJHeOpH',
    scopes:       tokenData.scope || '',
    tokenStatus:  'valid',
    createdAt:    new Date().toISOString()
  });
  scheduleRefresh(id);
  return id;
}

app.get(['/oauth/callback','/api/oauth/callback'], async (req,res)=>{
  const { code } = req.query;
  if (!code) return res.status(400).json({ error:'code required' });
  try {
    const redirectUri = req.path.startsWith('/api')
      ? (process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback')
      : (process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback');

    const tokenData = await exchangeCode(code, redirectUri);
    const id = storeInstall(tokenData);
    const url = `https://listings.engageautomations.com/?installation_id=${id}&welcome=true`;
    res.redirect(url);
  } catch (e) {
    console.error('OAuth error', e.response?.data || e.message);
    res.status(500).json({ error:'OAuth failed', details:e.response?.data || e.message });
  }
});

app.get('/api/oauth/status', (req,res)=>{
  const inst = installations.get(req.query.installation_id);
  if (!inst) return res.json({ authenticated:false });
  res.json({ authenticated:true, tokenStatus:inst.tokenStatus, locationId:inst.locationId });
});

// ───────────────────────────────────────────────────────
// GHL PROXY ROUTES
// ───────────────────────────────────────────────────────
app.get('/api/ghl/test-connection', async (req,res)=>{
  const inst = requireInstall(req,res); if (!inst) return;
  try {
    await ensureFreshToken(inst.id);
    const { data } = await axios.get(`https://services.leadconnectorhq.com/locations/${inst.locationId}`, {
      headers:{ Authorization:`Bearer ${inst.accessToken}`, Version:'2021-07-28', Accept:'application/json' }, timeout:15000 });
    res.json({ success:true, location:data });
  } catch(e) {
    res.status(400).json({ success:false, error:e.response?.data || e.message });
  }
});

app.get('/api/ghl/products', async (req,res)=>{
  const inst = requireInstall(req,res); if (!inst) return;
  const { limit=20, offset=0 } = req.query;
  try {
    await ensureFreshToken(inst.id);
    const { data } = await axios.get(`https://services.leadconnectorhq.com/products/?locationId=${inst.locationId}&limit=${limit}&offset=${offset}`, {
      headers:{ Authorization:`Bearer ${inst.accessToken}`, Version:'2021-07-28', Accept:'application/json' }, timeout:15000 });
    res.json({ success:true, products:data.products || [], total:data.total || 0 });
  } catch(e) {
    res.status(400).json({ success:false, error:e.response?.data || e.message });
  }
});

app.post('/api/ghl/products/create', async (req,res)=>{
  const inst = requireInstall(req,res); if (!inst) return;
  const { name, description, price, productType='DIGITAL' } = req.body;
  const product = { name, description, locationId:inst.locationId, productType, availableInStore:true };
  if (price && !isNaN(parseFloat(price))) product.price = parseFloat(price);
  try {
    await ensureFreshToken(inst.id);
    const { data } = await axios.post('https://services.leadconnectorhq.com/products/', product, {
      headers:{ Authorization:`Bearer ${inst.accessToken}`, 'Content-Type':'application/json', Version:'2021-07-28', Accept:'application/json' }, timeout:15000 });
    res.json({ success:true, product:data.product });
  } catch(e) {
    res.status(400).json({ success:false, error:e.response?.data || e.message });
  }
});

app.post('/api/ghl/contacts/create', async (req,res)=>{
  const inst = requireInstall(req,res); if (!inst) return;
  const { firstName='Test', lastName='Contact', email=`test${Date.now()}@example.com`, phone } = req.body;
  const contact = { firstName, lastName, email, locationId:inst.locationId, source:'OAuth Integration' };
  if (phone) contact.phone = phone;
  try {
    await ensureFreshToken(inst.id);
    const { data } = await axios.post('https://services.leadconnectorhq.com/contacts/', contact, {
      headers:{ Authorization:`Bearer ${inst.accessToken}`, 'Content-Type':'application/json', Version:'2021-07-28', Accept:'application/json' }, timeout:15000 });
    res.json({ success:true, contact:data.contact });
  } catch(e) {
    res.status(400).json({ success:false, error:e.response?.data || e.message });
  }
});

// ──────────────────────────────────────────────
// MEDIA UPLOAD  – multipart field "file"
// ──────────────────────────────────────────────
const uploadTmp = multer({ dest:'/tmp' });

app.post('/api/ghl/media/upload', uploadTmp.single('file'), async (req,res)=>{
  const inst = requireInstall(req,res); if (!inst) return;
  if (!req.file) return res.status(400).json({ success:false, error:'file field missing' });
  try {
    await ensureFreshToken(inst.id);
    const form = new FormData();
    form.append('file', fs.createReadStream(req.file.path));
    form.append('fileName', req.file.originalname);
    form.append('locationId', inst.locationId);
    const { data } = await axios.post('https://services.leadconnectorhq.com/medias/upload-file', form, {
      headers:{ ...form.getHeaders(), Authorization:`Bearer ${inst.accessToken}`, Version:'2021-07-28', Accept:'application/json' }, timeout:20000 });
    fs.unlink(req.file.path, ()=>{});
    res.json({ success:true, mediaId:data.fileId, url:data.fileUrl });
  } catch(e) {
    fs.unlink(req.file.path, ()=>{});
    res.status(400).json({ success:false, error:e.response?.data || e.message });
  }
});

// ──────────────────────────────────────────────
// START SERVER & RE‑ARM REFRESH TIMERS
// ──────────────────────────────────────────────
app.listen(port,'0.0.0.0',()=>{
  console.log(`GHL proxy listening on ${port}`);
  for (const id of installations.keys()) scheduleRefresh(id);
});

module.exports = app;
