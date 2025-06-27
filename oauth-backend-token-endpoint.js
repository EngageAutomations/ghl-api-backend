// Token access endpoint for API backend bridge
app.get('/api/oauth/token/:installationId', async (req, res) => {
  try {
    const { installationId } = req.params;
    
    // Get installation from database or memory
    let installation = null;
    
    if (db) {
      // Try database first
      const installations = await db
        .select()
        .from(schema.oauthInstallations)
        .where(eq(schema.oauthInstallations.id, parseInt(installationId)))
        .limit(1);
      installation = installations[0];
    }
    
    if (!installation) {
      // Fallback to memory storage
      installation = installations.get(installationId);
    }
    
    if (!installation) {
      return res.status(404).json({
        error: 'Installation not found',
        installationId
      });
    }
    
    // Check if token needs refresh
    const now = Date.now();
    const expiresAt = installation.expiresAt || (installation.installationDate + (installation.ghlExpiresIn * 1000));
    
    if (now >= expiresAt - PADDING_MS) {
      // Token expired or close to expiring, try refresh
      if (installation.ghlRefreshToken || installation.refreshToken) {
        try {
          const refreshed = await refreshAccessToken(installationId);
          if (refreshed) {
            installation = installations.get(installationId) || installation;
          }
        } catch (error) {
          console.error('Token refresh failed:', error.message);
        }
      }
    }
    
    res.json({
      success: true,
      accessToken: installation.ghlAccessToken || installation.accessToken,
      locationId: installation.ghlLocationId || installation.locationId || 'WAvk87RmW9rBSDJHeOpH',
      installationId: installation.id || installation.ghlUserId,
      tokenStatus: 'valid',
      expiresAt: installation.expiresAt
    });
    
  } catch (error) {
    console.error('Token access failed:', error.message);
    res.status(500).json({
      error: 'Failed to get token',
      message: error.message
    });
  }
});