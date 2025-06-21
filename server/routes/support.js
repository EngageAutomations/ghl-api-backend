import express from 'express';
import { storage } from '../storage.js';
import { validateLocationParam } from '../middleware/validateLocationParam.js';

const router = express.Router();

/**
 * Search GoHighLevel locations for autocomplete
 * GET /api/support/locations?query=searchTerm
 */
router.get('/locations', async (req, res) => {
  try {
    const { query, page = 1, limit = 50 } = req.query;
    
    // Mock location data for development - replace with actual GHL API call
    const mockLocations = [
      { id: 'WAvk87RmW9rBSDJHeOpH', name: 'Acme Construction LLC', address: '123 Main St, Denver, CO' },
      { id: 'ABC123XYZ789DEF456GH', name: 'Acme Plumbing Services', address: '456 Oak Ave, Boulder, CO' },
      { id: 'XYZ789ABC123DEF456JK', name: 'Prime Contractors Inc', address: '789 Pine Rd, Aurora, CO' },
      { id: 'DEF456GHI789JKL012MN', name: 'Elite Home Builders', address: '321 Elm St, Lakewood, CO' },
      { id: 'GHI789JKL012MNO345PQ', name: 'Mountain View Roofing', address: '654 Cedar Ln, Fort Collins, CO' }
    ];

    let filteredLocations = mockLocations;
    
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredLocations = mockLocations.filter(location => 
        location.name.toLowerCase().includes(searchTerm) ||
        location.address.toLowerCase().includes(searchTerm)
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

    res.json({
      locations: paginatedLocations,
      total: filteredLocations.length,
      page: parseInt(page),
      limit: parseInt(limit),
      hasMore: endIndex < filteredLocations.length
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

/**
 * Test location access permissions
 * GET /api/support/locations/:locationId/ping
 */
router.get('/locations/:locationId/ping', validateLocationParam, async (req, res) => {
  try {
    const { locationId } = req.params;
    
    // Mock permission check - replace with actual GHL API call
    const hasAccess = locationId.startsWith('W') || locationId.includes('ABC'); // Mock logic
    
    if (hasAccess) {
      res.json({
        success: true,
        locationId,
        hasAccess: true,
        message: 'Location access confirmed'
      });
    } else {
      res.json({
        success: false,
        locationId,
        hasAccess: false,
        message: 'You do not have access to this location'
      });
    }
  } catch (error) {
    console.error('Error checking location access:', error);
    res.status(500).json({ error: 'Failed to verify location access' });
  }
});

/**
 * Bulk update location enhancements
 * POST /api/support/locations/bulk-enhance
 */
router.post('/locations/bulk-enhance', async (req, res) => {
  try {
    const { locationIds, directoryName, userId, enhancementConfig } = req.body;

    if (!Array.isArray(locationIds) || locationIds.length === 0) {
      return res.status(400).json({ error: 'Location IDs array is required' });
    }

    if (!directoryName || !userId || !enhancementConfig) {
      return res.status(400).json({ error: 'Directory name, user ID, and enhancement config are required' });
    }

    const results = [];
    const errors = [];

    for (const locationId of locationIds) {
      try {
        // Check if enhancement already exists
        const existing = await storage.getLocationEnhancement(locationId, directoryName);
        
        if (existing) {
          // Update existing
          const updated = await storage.updateLocationEnhancement(existing.id, {
            enhancementConfig,
            updatedAt: new Date()
          });
          results.push({ locationId, action: 'updated', enhancement: updated });
        } else {
          // Create new
          const created = await storage.createLocationEnhancement({
            ghlLocationId: locationId,
            directoryName,
            userId,
            enhancementConfig,
            isActive: true
          });
          results.push({ locationId, action: 'created', enhancement: created });
        }
      } catch (error) {
        errors.push({ locationId, error: error.message });
      }
    }

    res.json({
      success: true,
      updated: results.length,
      errors: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error bulk updating enhancements:', error);
    res.status(500).json({ error: 'Failed to bulk update location enhancements' });
  }
});

export default router;