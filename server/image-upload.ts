import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload multiple images temporarily
router.post('/upload-temp', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      tempPath: file.path,
      url: `/uploads/temp/${file.filename}`, // Accessible URL for the temp file
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Upload images to GoHighLevel and get permanent URLs
router.post('/upload-to-ghl', async (req, res) => {
  try {
    const { tempFiles, installationId } = req.body;

    if (!tempFiles || !Array.isArray(tempFiles)) {
      return res.status(400).json({ error: 'No temp files provided' });
    }

    const ghlUploadResults = [];

    for (const tempFile of tempFiles) {
      try {
        // Get the temporary file URL that GoHighLevel can access
        const tempFileUrl = `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:3000'}${tempFile.url}`;
        
        // Upload to GoHighLevel via Railway backend
        const ghlResponse = await fetch('https://dir.engageautomations.com/api/ghl/media/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            installationId,
            imageUrl: tempFileUrl,
            fileName: tempFile.originalName
          })
        });

        const ghlResult = await ghlResponse.json();
        
        if (ghlResult.success) {
          ghlUploadResults.push({
            ...tempFile,
            ghlUrl: ghlResult.mediaUrl,
            ghlMediaId: ghlResult.mediaId,
            success: true
          });
        } else {
          ghlUploadResults.push({
            ...tempFile,
            success: false,
            error: ghlResult.message
          });
        }
      } catch (uploadError) {
        console.error(`Failed to upload ${tempFile.originalName} to GHL:`, uploadError);
        ghlUploadResults.push({
          ...tempFile,
          success: false,
          error: 'Upload to GoHighLevel failed'
        });
      }
    }

    res.json({
      success: true,
      uploads: ghlUploadResults
    });
  } catch (error) {
    console.error('GHL upload error:', error);
    res.status(500).json({ error: 'Failed to upload to GoHighLevel' });
  }
});

// Clean up temporary files
router.post('/cleanup-temp', async (req, res) => {
  try {
    const { tempPaths } = req.body;

    if (!tempPaths || !Array.isArray(tempPaths)) {
      return res.status(400).json({ error: 'No temp paths provided' });
    }

    const cleanupResults = [];

    for (const tempPath of tempPaths) {
      try {
        await fs.unlink(tempPath);
        cleanupResults.push({ path: tempPath, cleaned: true });
      } catch (cleanupError) {
        console.error(`Failed to cleanup ${tempPath}:`, cleanupError);
        cleanupResults.push({ path: tempPath, cleaned: false, error: cleanupError.message });
      }
    }

    res.json({
      success: true,
      cleanup: cleanupResults
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup temp files' });
  }
});

export default router;