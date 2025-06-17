import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

interface UploadedFile {
  name: string;
  data: Buffer;
  size: number;
  mimetype: string;
}

interface RequestWithFiles extends Request {
  files?: {
    file?: UploadedFile;
    [key: string]: any;
  };
}

export function handleMediaUpload(req: RequestWithFiles, res: Response) {
  console.log('=== MEDIA UPLOAD HANDLER ===');
  
  try {
    if (!req.files || !req.files.file) {
      console.log('No file provided in request');
      return res.status(400).json({ 
        error: 'No file provided',
        received: req.files ? Object.keys(req.files) : 'no files object'
      });
    }

    const file = req.files.file;
    console.log('Processing file:', { 
      name: file.name, 
      size: file.size, 
      mimetype: file.mimetype 
    });
    
    // Create uploads directory with absolute path
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    
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
      fileName: file.name,
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
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}