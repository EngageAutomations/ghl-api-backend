const fetch = require('node-fetch');

class MemoryStore {
  constructor() {
    this.installations = new Map();
    this.locationIndex = new Map();
  }
  
  createInstallation(installationData) {
    this.installations.set(installationData.id, installationData);
    
    if (installationData.locationId) {
      this.locationIndex.set(installationData.locationId, installationData.id);
      console.log(`Location index updated: ${installationData.locationId} -> ${installationData.id}`);
    }
    
    console.log(`Installation stored: ${installationData.id}`);
    return installationData;
  }
  
  getAllInstallations() {
    return Array.from(this.installations.values());
  }
  
  getInstallationById(id) {
    return this.installations.get(id);
  }
  
  getInstallationByLocation(locationId) {
    const installationId = this.locationIndex.get(locationId);
    return installationId ? this.installations.get(installationId) : null;
  }
}

const store = new MemoryStore();

function byLocation(locationId) {
  const installation = store.getInstallationByLocation(locationId);
  if (!installation) {
    console.log(`No installation found for location: ${locationId}`);
    console.log('Available locations:', Array.from(store.locationIndex.keys()));
  }
  return installation;
}

async function ensureFresh(installationId) {
  const installation = store.getInstallationById(installationId);
  
  if (!installation || !installation.access_token) {
    console.log(`No installation or token for: ${installationId}`);
    return null;
  }
  
  const now = Date.now();
  const created = new Date(installation.created_at).getTime();
  const expiresIn = (installation.expires_in || 3600) * 1000;
  const timeRemaining = (created + expiresIn) - now;
  
  if (timeRemaining <= 300000) {
    console.log(`Token needs refresh for installation: ${installationId}`);
    return await refreshToken(installation);
  }
  
  return installation.access_token;
}

async function refreshToken(installation) {
  try {
    if (!installation.refresh_token) {
      console.error('No refresh token available for installation:', installation.id);
      return null;
    }
    
    console.log('Refreshing token for installation:', installation.id);
    
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: installation.refresh_token,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET
      })
    });
    
    if (response.ok) {
      const tokenData = await response.json();
      
      installation.access_token = tokenData.access_token;
      installation.expires_in = tokenData.expires_in;
      installation.created_at = new Date().toISOString();
      
      if (tokenData.refresh_token) {
        installation.refresh_token = tokenData.refresh_token;
      }
      
      console.log('Token refreshed successfully for:', installation.id);
      return tokenData.access_token;
    } else {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Token refresh error:', error.message);
    return null;
  }
}

module.exports = {
  store,
  byLocation,
  ensureFresh,
  refreshToken
};