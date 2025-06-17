// Pure JavaScript media upload handler to bypass ES module conflicts
const fs = require('fs');
const path = require('path');

function handleMediaUpload(req, res) {
  console.log('=== SIMPLE MEDIA UPLOAD HANDLER ===');
  
  try {
    const files = req.files;
    
    if (!files || !files.file) {
      console.log('No file provided in request');
      return res.status(400).json({ 
        error: 'No file provided',
        received: files ? Object.keys(files) : 'no files object'
      });
    }

    const file = files.file;
    console.log('Processing file:', { 
      name: file.name, 
      size: file.size, 
      mimetype: file.mimetype 
    });
    
    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory:', uploadsDir);
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension);
    const fileName = `${timestamp}_${baseName}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Write file to disk
    fs.writeFileSync(filePath, file.data);
    console.log('File saved successfully to:', filePath);
    
    // Generate accessible URL
    const fileUrl = `http://localhost:5000/uploads/${fileName}`;
    
    const response = {
      success: true,
      fileUrl: fileUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      mimetype: file.mimetype,
      timestamp: timestamp
    };

    console.log('Upload successful, returning response');
    res.json(response);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message,
      type: 'simple_upload_handler'
    });
  }
}

module.exports = { handleMediaUpload };