import { Request, Response } from 'express';
import { getInstallationToken } from './oauth-handler';
import { GHL_OAUTH_CONFIG } from './ghl-oauth';

interface GHLAPIRequest extends Request {
  params: {
    locationId: string;
    productId?: string;
    priceId?: string;
  };
}

// Helper function to make authenticated GHL API calls
async function makeGHLRequest(
  method: string,
  endpoint: string,
  locationId: string,
  body?: any,
  headers: Record<string, string> = {}
) {
  const accessToken = getInstallationToken(locationId);
  
  if (!accessToken) {
    throw new Error('No valid access token for location');
  }

  const url = `${GHL_OAUTH_CONFIG.apiBaseUrl}${endpoint}`;
  
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(body);
  }

  console.log(`🔗 GHL API ${method} ${url}`);
  
  const response = await fetch(url, requestOptions);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ GHL API error ${response.status}:`, errorText);
    throw new Error(`GHL API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

// === PRODUCT API ENDPOINTS ===

export async function createProduct(req: GHLAPIRequest, res: Response) {
  const { locationId } = req.params;
  const productData = req.body;

  try {
    const result = await makeGHLRequest('POST', '/products/', locationId, {
      ...productData,
      locationId
    });

    console.log('✅ Product created:', result.product?.id);
    res.json(result);

  } catch (error) {
    console.error('❌ Product creation failed:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getProducts(req: GHLAPIRequest, res: Response) {
  const { locationId } = req.params;
  const { limit = 20, offset = 0, search } = req.query;

  try {
    let endpoint = `/products/?locationId=${locationId}&limit=${limit}&offset=${offset}`;
    if (search) {
      endpoint += `&search=${encodeURIComponent(search as string)}`;
    }

    const result = await makeGHLRequest('GET', endpoint, locationId);
    res.json(result);

  } catch (error) {
    console.error('❌ Products fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getProduct(req: GHLAPIRequest, res: Response) {
  const { locationId, productId } = req.params;

  try {
    const result = await makeGHLRequest('GET', `/products/${productId}?locationId=${locationId}`, locationId);
    res.json(result);

  } catch (error) {
    console.error('❌ Product fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function updateProduct(req: GHLAPIRequest, res: Response) {
  const { locationId, productId } = req.params;
  const updateData = req.body;

  try {
    const result = await makeGHLRequest('PUT', `/products/${productId}`, locationId, updateData);
    res.json(result);

  } catch (error) {
    console.error('❌ Product update failed:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function deleteProduct(req: GHLAPIRequest, res: Response) {
  const { locationId, productId } = req.params;

  try {
    const result = await makeGHLRequest('DELETE', `/products/${productId}`, locationId);
    res.json(result);

  } catch (error) {
    console.error('❌ Product deletion failed:', error);
    res.status(500).json({ error: error.message });
  }
}

// === MEDIA API ENDPOINTS ===

export async function uploadMedia(req: Request, res: Response) {
  const { locationId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const accessToken = getInstallationToken(locationId);
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No valid access token for location' });
    }

    // Create form data for GoHighLevel
    const formData = new FormData();
    const fileBlob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('file', fileBlob, req.file.originalname);
    formData.append('locationId', locationId);

    console.log('📁 Uploading media for location:', locationId, {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    const response = await fetch(`${GHL_OAUTH_CONFIG.apiBaseUrl}/medias/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28'
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Media upload failed:', response.status, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();
    console.log('✅ Media uploaded:', result.url);
    res.json(result);

  } catch (error) {
    console.error('❌ Media upload error:', error);
    res.status(500).json({ error: error.message });
  }
}

export async function getMediaFiles(req: GHLAPIRequest, res: Response) {
  const { locationId } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  try {
    const endpoint = `/medias/?locationId=${locationId}&limit=${limit}&offset=${offset}`;
    const result = await makeGHLRequest('GET', endpoint, locationId);
    res.json(result);

  } catch (error) {
    console.error('❌ Media files fetch failed:', error);
    res.status(500).json({ error: error.message });
  }
}