const express = require('express');
const { requireOAuth } = require('../middleware/oauth-bridge');
const { createContact, getContacts } = require('../utils/ghl-client');

const router = express.Router();

// Create contact
router.post('/', requireOAuth, async (req, res) => {
  try {
    const contactData = {
      ...req.body,
      locationId: req.locationId
    };
    
    const contact = await createContact(contactData, req.accessToken);
    res.json({
      success: true,
      contact
    });
  } catch (error) {
    res.status(500).json({
      error: 'Contact creation failed',
      message: error.message,
      details: error.response?.data
    });
  }
});

// List contacts
router.get('/', requireOAuth, async (req, res) => {
  try {
    const contacts = await getContacts(req.locationId, req.accessToken, req.query);
    res.json({
      success: true,
      contacts,
      count: contacts.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch contacts',
      message: error.message
    });
  }
});

module.exports = router;