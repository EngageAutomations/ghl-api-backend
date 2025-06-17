import { Request, Response } from 'express';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { formSubmissions, formConfigurations } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

interface FormSubmissionData {
  name: string;
  description: string;
  image: string;
  price?: string;
  expanded_description?: string;
  seo_title: string;
  seo_description: string;
  url_slug: string;
  address?: string;
  [key: string]: any;
}

/**
 * Generate GoHighLevel API-compatible product data
 */
function generateGHLProductData(formData: FormSubmissionData, locationId: string, directoryName: string) {
  const ghlData = {
    product: {
      name: formData.name,
      description: formData.description,
      images: formData.image ? [formData.image] : [],
      price: formData.price ? {
        amount: parseFloat(formData.price.replace(/[^0-9.]/g, '')) * 100, // Convert to cents
        currency: 'USD'
      } : null,
      slug: formData.url_slug,
      seo: {
        title: formData.seo_title,
        description: formData.seo_description,
        slug: formData.url_slug
      },
      metadata: {
        expanded_description: formData.expanded_description || '',
        location_id: locationId,
        directory_name: directoryName,
        created_via: 'directory_form',
        submission_timestamp: new Date().toISOString()
      },
      status: 'active',
      visibility: 'public'
    },
    locationId: locationId,
    submissionId: uuidv4(),
    processedAt: new Date().toISOString()
  };

  // Add address data if provided
  if (formData.address) {
    ghlData.product.metadata.address = formData.address;
  }

  // Add any additional metadata fields
  Object.keys(formData).forEach(key => {
    if (!['name', 'description', 'image', 'price', 'expanded_description', 'seo_title', 'seo_description', 'url_slug', 'address'].includes(key)) {
      ghlData.product.metadata[key] = formData[key];
    }
  });

  return ghlData;
}

/**
 * Save JSON file to filesystem
 */
function saveJSONFile(data: any, locationId: string, directoryName: string, submissionId: string): string {
  const uploadsDir = join(process.cwd(), 'uploads', 'submissions', locationId, directoryName);
  
  // Create directory if it doesn't exist
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const fileName = `submission-${submissionId}-${Date.now()}.json`;
  const filePath = join(uploadsDir, fileName);
  
  writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  // Return relative path for storage
  return `/uploads/submissions/${locationId}/${directoryName}/${fileName}`;
}

/**
 * Handle form submission
 */
export async function handleFormSubmission(req: Request, res: Response) {
  try {
    const { locationId, directoryName } = req.params;
    const formData: FormSubmissionData = req.body;

    if (!locationId || !directoryName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Location ID and directory name are required' 
      });
    }

    // Validate required fields
    const requiredFields = ['name', 'description', 'image', 'seo_title', 'seo_description', 'url_slug'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Get form configuration (optional - use defaults if not found)
    let formConfig;
    try {
      const [config] = await db
        .select()
        .from(formConfigurations)
        .where(and(
          eq(formConfigurations.locationId, locationId),
          eq(formConfigurations.directoryName, directoryName),
          eq(formConfigurations.isActive, true)
        ));
      formConfig = config;
    } catch (error) {
      console.warn('Form configuration not found, using defaults');
    }

    // Generate GoHighLevel data
    const ghlData = generateGHLProductData(formData, locationId, directoryName);
    
    // Generate unique submission ID
    const submissionId = uuidv4();
    
    // Save JSON file
    const jsonFileUrl = saveJSONFile(ghlData, locationId, directoryName, submissionId);

    // Save to database
    const [submission] = await db
      .insert(formSubmissions)
      .values({
        formConfigId: formConfig?.id || 0, // Use 0 if no config found
        locationId,
        directoryName,
        submissionData: formData,
        ghlData,
        jsonFileUrl,
        status: 'processed'
      })
      .returning();

    res.json({
      success: true,
      submission: {
        id: submission.id,
        submissionId,
        jsonFileUrl,
        ghlData,
        downloadUrl: `${req.protocol}://${req.get('host')}/api/download${jsonFileUrl}`,
        status: 'processed'
      }
    });

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process form submission'
    });
  }
}

/**
 * Get form submissions for a location/directory
 */
export async function getFormSubmissions(req: Request, res: Response) {
  try {
    const { locationId, directoryName } = req.params;

    if (!locationId || !directoryName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Location ID and directory name are required' 
      });
    }

    const submissions = await db
      .select()
      .from(formSubmissions)
      .where(and(
        eq(formSubmissions.locationId, locationId),
        eq(formSubmissions.directoryName, directoryName)
      ))
      .orderBy(formSubmissions.submittedAt);

    res.json({
      success: true,
      submissions: submissions.map(sub => ({
        id: sub.id,
        status: sub.status,
        submittedAt: sub.submittedAt,
        productName: (sub.submissionData as any)?.name || 'Unknown',
        downloadUrl: sub.jsonFileUrl ? `${req.protocol}://${req.get('host')}/api/download${sub.jsonFileUrl}` : null
      }))
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions'
    });
  }
}

/**
 * Download JSON file
 */
export async function downloadJSONFile(req: Request, res: Response) {
  try {
    const filePath = req.path.replace('/api/download', '');
    const fullPath = join(process.cwd(), filePath);

    if (!existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.download(fullPath);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
}