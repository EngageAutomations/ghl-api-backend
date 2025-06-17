import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export class MediaUploadHandler {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    this.ensureUploadsDirectory();
  }

  private ensureUploadsDirectory(): void {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
      console.log('Created uploads directory:', this.uploadsDir);
    }
  }

  private detectFileType(buffer: Buffer, contentType?: string): { extension: string; mimeType: string } {
    // Check magic bytes for reliable file type detection
    const magicBytes = buffer.slice(0, 12);
    
    // PNG: 89 50 4E 47
    if (magicBytes[0] === 0x89 && magicBytes[1] === 0x50 && magicBytes[2] === 0x4E && magicBytes[3] === 0x47) {
      return { extension: '.png', mimeType: 'image/png' };
    }
    
    // JPEG: FF D8 FF
    if (magicBytes[0] === 0xFF && magicBytes[1] === 0xD8 && magicBytes[2] === 0xFF) {
      return { extension: '.jpg', mimeType: 'image/jpeg' };
    }
    
    // GIF: 47 49 46 38
    if (magicBytes[0] === 0x47 && magicBytes[1] === 0x49 && magicBytes[2] === 0x46 && magicBytes[3] === 0x38) {
      return { extension: '.gif', mimeType: 'image/gif' };
    }
    
    // WebP: RIFF...WEBP
    if (magicBytes.toString('ascii', 0, 4) === 'RIFF' && magicBytes.toString('ascii', 8, 12) === 'WEBP') {
      return { extension: '.webp', mimeType: 'image/webp' };
    }
    
    // Fallback to content-type if available
    if (contentType) {
      if (contentType.includes('jpeg')) return { extension: '.jpg', mimeType: 'image/jpeg' };
      if (contentType.includes('png')) return { extension: '.png', mimeType: 'image/png' };
      if (contentType.includes('gif')) return { extension: '.gif', mimeType: 'image/gif' };
      if (contentType.includes('webp')) return { extension: '.webp', mimeType: 'image/webp' };
    }
    
    // Default to PNG
    return { extension: '.png', mimeType: 'image/png' };
  }

  private parseMultipartData(buffer: Buffer, boundary: string): { fileData: Buffer; originalName?: string } | null {
    try {
      const boundaryBuffer = Buffer.from(`--${boundary}`);
      const parts = [];
      let start = 0;

      while (true) {
        const boundaryIndex = buffer.indexOf(boundaryBuffer, start);
        if (boundaryIndex === -1) break;
        
        if (start > 0) {
          parts.push(buffer.slice(start, boundaryIndex));
        }
        start = boundaryIndex + boundaryBuffer.length;
      }

      // Find the file part
      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        
        const headers = part.slice(0, headerEnd).toString();
        if (headers.includes('Content-Disposition') && headers.includes('filename')) {
          const fileData = part.slice(headerEnd + 4);
          
          // Extract original filename if present
          const filenameMatch = headers.match(/filename="([^"]+)"/);
          const originalName = filenameMatch ? filenameMatch[1] : undefined;
          
          return { fileData, originalName };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Multipart parsing error:', error);
      return null;
    }
  }

  async handleUpload(req: Request, res: Response): Promise<void> {
    console.log('=== MEDIA UPLOAD HANDLER ===');
    
    try {
      const contentType = req.get('content-type') || '';
      let fileData: Buffer | null = null;
      let originalName: string | undefined;

      if (contentType.includes('multipart/form-data')) {
        // Handle multipart form data
        const boundary = contentType.split('boundary=')[1];
        if (!boundary) {
          throw new Error('No boundary found in multipart data');
        }

        const rawBody = await this.collectRequestBody(req);
        const parsed = this.parseMultipartData(rawBody, boundary);
        
        if (parsed) {
          fileData = parsed.fileData;
          originalName = parsed.originalName;
        }
      } else {
        // Handle direct binary upload
        fileData = await this.collectRequestBody(req);
      }

      if (!fileData || fileData.length === 0) {
        throw new Error('No file data received');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const { extension, mimeType } = this.detectFileType(fileData, contentType);
      const fileName = `${timestamp}_upload${extension}`;
      const filePath = path.join(this.uploadsDir, fileName);

      // Write file to disk temporarily
      fs.writeFileSync(filePath, fileData);
      
      try {
        // Try to upload to GoHighLevel media API
        const ghlUrl = await this.uploadToGoHighLevel(fileData, fileName, mimeType);
        
        if (ghlUrl) {
          // Success: Return GoHighLevel URL and clean up local file
          fs.unlinkSync(filePath);
          
          console.log('Upload successful to GoHighLevel:', {
            fileName,
            ghlUrl,
            size: fileData.length,
            mimeType
          });

          res.json({
            success: true,
            fileUrl: ghlUrl,
            fileName: fileName,
            originalName: originalName || 'uploaded_file',
            size: fileData.length,
            mimetype: mimeType,
            timestamp: timestamp,
            source: 'gohighlevel'
          });
          return;
        }
      } catch (ghlError) {
        console.log('GoHighLevel upload failed, using local fallback:', ghlError);
      }
      
      // Fallback: Use local URL
      const fileUrl = `/uploads/${fileName}`;
      
      console.log('Upload successful (local fallback):', {
        fileName,
        size: fileData.length,
        mimeType,
        originalName
      });

      res.json({
        success: true,
        fileUrl: fileUrl,
        fileName: fileName,
        originalName: originalName || 'uploaded_file',
        size: fileData.length,
        mimetype: mimeType,
        timestamp: timestamp,
        source: 'local'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async uploadToGoHighLevel(fileData: Buffer, fileName: string, mimeType: string): Promise<string | null> {
    try {
      // Get OAuth installation for media upload
      const FormData = require('form-data');
      const fetch = require('node-fetch');
      
      // Use the authenticated installation for media upload
      const installationId = 'install_1750131573635';
      const accessToken = process.env.GHL_ACCESS_TOKEN;
      const locationId = 'WAvk87RmW9rBSDJHeOpH';
      
      if (!accessToken) {
        throw new Error('No GoHighLevel access token available');
      }

      const formData = new FormData();
      formData.append('file', fileData, {
        filename: fileName,
        contentType: mimeType
      });
      formData.append('hosted', 'true');

      const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/medias/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`GoHighLevel media upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.url) {
        return result.url;
      } else if (result.fileUrl) {
        return result.fileUrl;
      } else {
        throw new Error('No URL returned from GoHighLevel media upload');
      }

    } catch (error) {
      console.error('GoHighLevel media upload error:', error);
      return null;
    }
  }

  async handleCleanup(req: Request, res: Response): Promise<void> {
    try {
      const { imageUrl } = req.body;

      if (imageUrl && imageUrl.includes('/uploads/')) {
        const fileName = imageUrl.split('/uploads/')[1];
        const filePath = path.join(this.uploadsDir, fileName);

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Cleaned up temporary file:', fileName);
        }
      }

      res.json({ success: true, message: 'Cleanup completed' });
    } catch (error) {
      console.log('Cleanup error:', error);
      res.json({ success: false, message: 'Cleanup attempted' });
    }
  }

  private async collectRequestBody(req: Request): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      req.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      req.on('error', (error) => {
        reject(error);
      });
    });
  }
}