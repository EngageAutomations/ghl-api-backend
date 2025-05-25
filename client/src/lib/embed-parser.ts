/**
 * GoHighLevel Embed Code Parser
 * Extracts src URL and height from raw embed code
 */

export interface ParsedEmbedData {
  src: string;
  height: number;
  originalHeight: number;
}

/**
 * Parses GoHighLevel embed code to extract necessary information
 * @param embedCode - Raw iframe embed code from GoHighLevel
 * @returns Parsed embed data with src URL and height
 */
export function parseEmbedCode(embedCode: string): ParsedEmbedData | null {
  if (!embedCode || typeof embedCode !== 'string') {
    return null;
  }

  try {
    // Extract src URL using regex
    const srcMatch = embedCode.match(/src\s*=\s*["']([^"']+)["']/i);
    if (!srcMatch) {
      return null;
    }

    const src = srcMatch[1];

    // Extract height - try data-height first, then height attribute
    let height = 426; // Default height
    const dataHeightMatch = embedCode.match(/data-height\s*=\s*["']?(\d+)["']?/i);
    const heightMatch = embedCode.match(/height\s*=\s*["']?(\d+)["']?/i);
    
    if (dataHeightMatch) {
      height = parseInt(dataHeightMatch[1], 10);
    } else if (heightMatch) {
      height = parseInt(heightMatch[1], 10);
    }

    // Ensure height is valid
    if (isNaN(height) || height < 100) {
      height = 426;
    }

    return {
      src,
      height: height + 100, // Add 100px for extra spacing as specified
      originalHeight: height
    };

  } catch (error) {
    console.error('Error parsing embed code:', error);
    return null;
  }
}

/**
 * Validates if the parsed embed data is from a supported GoHighLevel domain
 * @param parsedData - Parsed embed data
 * @returns Boolean indicating if the embed is valid
 */
export function validateEmbedSource(parsedData: ParsedEmbedData): boolean {
  if (!parsedData || !parsedData.src) {
    return false;
  }

  const validDomains = [
    'gohighlevel.com',
    'app.gohighlevel.com',
    'forms.gohighlevel.com',
    'makerexpress3d.com', // Based on your example
    'app.makerexpress3d.com'
  ];

  try {
    const url = new URL(parsedData.src);
    return validDomains.some(domain => url.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Generates the custom iframe HTML for popup
 * @param parsedData - Parsed embed data
 * @returns HTML string for the custom iframe
 */
export function generateCustomIframe(parsedData: ParsedEmbedData): string {
  return `<div style="max-width: 100%; overflow: hidden;">
  <iframe
    src="${parsedData.src}"
    width="100%"
    height="${parsedData.height}"
    style="
      width: 100%;
      height: ${parsedData.height}px;
      border: none;
      border-radius: 6px;
      display: block;
      overflow: hidden;
    "
    scrolling="no"
    allowfullscreen
    title="Get Access Form"
  ></iframe>
</div>`;
}