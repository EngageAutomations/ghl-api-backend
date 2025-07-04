/**
 * Enhanced Media Upload Service with Location Token Support
 * Automatically converts Company tokens to Location tokens for media upload
 * 
 * IMPLEMENTATION:
 * - Uses Location token conversion for media operations
 * - Maintains compatibility with existing API structure
 * - Automatic retry with token refresh
 * - Full GoHighLevel media library integration
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { locationTokenConverter } from './location-token-converter';

interface MediaUploadRequest extends Request {
  file?: Express.Multer.File;
  body: {
    installation_id: string;
    name?: string;
    type?: string;
  };
  locationToken?: string;
  installationId?: string;
}

interface MediaUploadResponse {
  success: boolean;
  url?: string;
  mediaId?: string;
  error?: string;
  details?: any;
}

interface MediaListResponse {
  success: boolean;
  media?: any[];
  total?: number;
  error?: string;
  details?: any;
}

class EnhancedMediaUploadService {
  private readonly ghlApiBase = 'https://services.leadconnectorhq.com';

  /**
   * Upload media file using Location token
   */
  async uploadMedia(req: MediaUploadRequest, res: Response): Promise<void> {
    console.log('[ENHANCED MEDIA] Starting media upload with Location token conversion');

    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file provided'
        });
        return;
      }

      const { installation_id, name, type } = req.body;

      if (!installation_id) {
        res.status(400).json({
          success: false,
          error: 'installation_id required'
        });
        return;
      }

      console.log('[ENHANCED MEDIA] File details:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Get Location token for media upload
      const locationToken = await locationTokenConverter.getLocationToken(installation_id);

      if (!locationToken) {
        res.status(401).json({
          success: false,
          error: 'Failed to obtain Location-level access token',
          details: 'Media upload requires Location-level authentication'
        });
        return;
      }

      // Get location ID from installation
      const installation = await this.getInstallation(installation_id);
      if (!installation?.locationId) {
        res.status(400).json({
          success: false,
          error: 'Location ID not found for installation'
        });
        return;
      }

      // Upload to GoHighLevel using Location token
      const uploadResult = await this.performMediaUpload(
        req.file,
        locationToken,
        installation.locationId,
        { name, type }
      );

      if (uploadResult.success) {
        console.log('[ENHANCED MEDIA] ✅ Upload successful:', uploadResult.url);
        res.json(uploadResult);
      } else {
        console.error('[ENHANCED MEDIA] ❌ Upload failed:', uploadResult.error);
        res.status(500).json(uploadResult);
      }

    } catch (error) {
      console.error('[ENHANCED MEDIA] Upload error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Media upload failed',
        details: error.message
      });
    }
  }

  /**
   * List media files using Location token
   */
  async listMedia(req: Request, res: Response): Promise<void> {
    console.log('[ENHANCED MEDIA] Listing media files with Location token');

    try {
      const installation_id = req.query.installation_id as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!installation_id) {
        res.status(400).json({
          success: false,
          error: 'installation_id required'
        });
        return;
      }

      // Get Location token
      const locationToken = await locationTokenConverter.getLocationToken(installation_id);

      if (!locationToken) {
        res.status(401).json({
          success: false,
          error: 'Failed to obtain Location-level access token'
        });
        return;
      }

      // Get location ID
      const installation = await this.getInstallation(installation_id);
      if (!installation?.locationId) {
        res.status(400).json({
          success: false,
          error: 'Location ID not found'
        });
        return;
      }

      // List media files
      const mediaList = await this.performMediaList(
        locationToken,
        installation.locationId,
        { limit, offset }
      );

      console.log(`[ENHANCED MEDIA] ✅ Listed ${mediaList.media?.length || 0} media files`);
      res.json(mediaList);

    } catch (error) {
      console.error('[ENHANCED MEDIA] List error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Media list failed',
        details: error.message
      });
    }
  }

  /**
   * Perform actual media upload to GoHighLevel
   */
  private async performMediaUpload(
    file: Express.Multer.File,
    locationToken: string,
    locationId: string,
    options: { name?: string; type?: string } = {}
  ): Promise<MediaUploadResponse> {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      const fileBlob = new Blob([file.buffer], { type: file.mimetype });
      
      formData.append('file', fileBlob, options.name || file.originalname);
      formData.append('locationId', locationId);

      if (options.type) {
        formData.append('type', options.type);
      }

      console.log('[ENHANCED MEDIA] Uploading to GoHighLevel:', {
        endpoint: `/locations/${locationId}/medias/upload-file`,
        filename: options.name || file.originalname,
        locationId
      });

      const response = await fetch(`${this.ghlApiBase}/locations/${locationId}/medias/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28'
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[ENHANCED MEDIA] API error:', response.status, errorText);
        
        return {
          success: false,
          error: `GoHighLevel API error: ${response.status}`,
          details: errorText
        };
      }

      const result = await response.json();
      
      return {
        success: true,
        url: result.url,
        mediaId: result.id,
        details: result
      };

    } catch (error) {
      console.error('[ENHANCED MEDIA] Upload error:', error.message);
      return {
        success: false,
        error: 'Upload request failed',
        details: error.message
      };
    }
  }

  /**
   * List media files from GoHighLevel
   */
  private async performMediaList(
    locationToken: string,
    locationId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<MediaListResponse> {
    try {
      const params = new URLSearchParams({
        locationId,
        limit: (options.limit || 20).toString(),
        offset: (options.offset || 0).toString()
      });

      const response = await fetch(`${this.ghlApiBase}/locations/${locationId}/medias?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `GoHighLevel API error: ${response.status}`,
          details: errorText
        } as MediaListResponse;
      }

      const result = await response.json();
      
      return {
        success: true,
        media: result.medias || result.data || [],
        total: result.total || result.count || 0
      };

    } catch (error) {
      return {
        success: false,
        error: 'Media list request failed',
        details: error.message
      };
    }
  }

  /**
   * Get installation data for location ID
   */
  private async getInstallation(installationId: string): Promise<{ locationId: string } | null> {
    try {
      const response = await fetch('https://dir.engageautomations.com/api/token-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ installation_id: installationId })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (!data.success) {
        return null;
      }

      return {
        locationId: data.locationId
      };

    } catch (error) {
      console.error('[ENHANCED MEDIA] Installation lookup error:', error.message);
      return null;
    }
  }
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common media types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mp3', 'audio/wav', 'audio/ogg',
      'application/pdf',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

// Export service and multer middleware
export const enhancedMediaUploadService = new EnhancedMediaUploadService();
export const mediaUploadMiddleware = upload.single('file');
export { EnhancedMediaUploadService };