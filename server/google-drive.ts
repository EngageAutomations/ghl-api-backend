import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * Google Drive service for handling file uploads to user's Google Drive
 */
export class GoogleDriveService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.REPL_URL || 'http://localhost:5000'}/auth/google/callback`
    );
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Set user credentials
   */
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Create or get Directory Images folder
   */
  async createDirectoryFolder(): Promise<string> {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    // Check if folder already exists
    const response = await drive.files.list({
      q: "name='Directory Images' and mimeType='application/vnd.google-apps.folder'",
      fields: 'files(id, name)'
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create new folder
    const folderMetadata = {
      name: 'Directory Images',
      mimeType: 'application/vnd.google-apps.folder'
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id'
    });

    return folder.data.id!;
  }

  /**
   * Upload image to Google Drive
   */
  async uploadImage(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
    folderId?: string
  ): Promise<{ fileId: string; webViewLink: string; webContentLink: string }> {
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    if (!folderId) {
      folderId = await this.createDirectoryFolder();
    }

    const fileMetadata = {
      name: fileName,
      parents: [folderId]
    };

    const media = {
      mimeType,
      body: buffer
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    // Make file publicly viewable
    await drive.permissions.create({
      fileId: file.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return {
      fileId: file.data.id!,
      webViewLink: file.data.webViewLink!,
      webContentLink: file.data.webContentLink!
    };
  }

  /**
   * Get public URL for image display
   */
  getPublicImageUrl(fileId: string): string {
    return `https://drive.google.com/uc?id=${fileId}&export=view`;
  }
}

export const googleDriveService = new GoogleDriveService();