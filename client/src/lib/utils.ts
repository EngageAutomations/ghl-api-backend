import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and merges Tailwind classes using tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date using a specified format
 */
export function formatDate(date: Date | string | number, format: string = 'medium') {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return 'Invalid date'
  }
  
  if (format === 'medium') {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }
  
  if (format === 'long') {
    return d.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  if (format === 'relative') {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'just now'
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    }
    
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  }
  
  return d.toLocaleDateString()
}

/**
 * Truncates a string to a specified length and adds an ellipsis if needed
 */
export function truncateString(str: string, maxLength: number) {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '...'
}

/**
 * Generates a random string of specified length
 */
export function generateRandomId(length: number = 8) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  
  return result
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalizeFirstLetter(string: string) {
  if (!string) return ''
  return string.charAt(0).toUpperCase() + string.slice(1)
}

/**
 * Formats a subdomain string by:
 * - Converting to lowercase
 * - Removing special characters and spaces
 * - Replacing spaces with hyphens
 */
export function formatSubdomain(input: string): string {
  if (!input) return ''
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/-+/g, '-')          // Replace multiple - with single -
}

/**
 * Converts Google Drive and other cloud storage links to direct download URLs
 */
export function convertToDirectDownloadLink(url: string): { convertedUrl: string; isConverted: boolean } {
  if (!url) {
    return { convertedUrl: '', isConverted: false };
  }
  
  // Handle Google Drive links
  if (url.includes('drive.google.com/file/d/')) {
    // Convert from https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    // to https://drive.google.com/uc?export=download&id=FILE_ID
    const fileIdMatch = url.match(/\/file\/d\/([^\/]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      return {
        convertedUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        isConverted: true
      };
    }
  }
  
  // Handle Dropbox links
  if (url.includes('dropbox.com') && !url.includes('dl=1')) {
    // Convert standard share links to direct download links
    const separator = url.includes('?') ? '&' : '?';
    return {
      convertedUrl: `${url}${separator}dl=1`,
      isConverted: true
    };
  }
  
  // Handle OneDrive links (simplified approach)
  if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
    // For OneDrive, we'd need to implement more complex logic
    // This is a placeholder for future implementation
    console.log('OneDrive link detected - using original URL');
  }
  
  // Return original URL if no conversion was applied
  return { convertedUrl: url, isConverted: false };
}