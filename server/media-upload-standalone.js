/**
 * Standalone Media Upload Handler
 * Pure CommonJS implementation to avoid ES module conflicts
 */

const fs = require('fs');
const path = require('path');

function handleMediaUpload(req, res) {
  console.log('=== STANDALONE MEDIA UPLOAD ===');
  
  try {
    // Check if files exist
    if (!req.files || !req.files.file) {
      console.log('❌ No file provided');
      return res.status(400).json({ 
        error: 'No file provided',
        debug: 'req.files or req.files.file missing'
      });
    }

    const file = req.files.file;
    console.log('✅ File received:', {
      name: file.name,
      size: file.size,
      mimetype: file.mimetype
    });

    // Create uploads directory
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    const fileName = `${timestamp}_${baseName}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.data);
    console.log('✅ File saved to:', filePath);

    // Generate URL
    const fileUrl = `http://localhost:5000/uploads/${fileName}`;
    
    const response = {
      success: true,
      fileUrl: fileUrl,
      fileName: file.name,
      originalName: file.name,
      size: file.size,
      mimetype: file.mimetype,
      timestamp: timestamp
    };

    console.log('✅ Upload successful:', response);
    res.json(response);

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error.message,
      stack: error.stack
    });
  }
}

module.exports = { handleMediaUpload };