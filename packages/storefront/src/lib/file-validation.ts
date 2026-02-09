const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/svg+xml',
];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MIN_IMAGE_WIDTH = 500;
const MIN_IMAGE_HEIGHT = 500;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileFormat(file: File): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file format. Allowed formats: JPG, PNG, SVG`,
    };
  }
  return { valid: true };
}

export function validateFileSize(file: File, maxMB: number = MAX_FILE_SIZE_MB): ValidationResult {
  if (file.size > maxMB * 1024 * 1024) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxMB}MB`,
    };
  }
  return { valid: true };
}

export function validateImageDimensions(
  file: File,
  minWidth: number = MIN_IMAGE_WIDTH,
  minHeight: number = MIN_IMAGE_HEIGHT,
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    // Skip dimension validation for SVG
    if (file.type === 'image/svg+xml') {
      resolve({ valid: true });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width < minWidth || img.height < minHeight) {
        resolve({
          valid: false,
          error: `Image dimensions must be at least ${minWidth}x${minHeight}px. Current: ${img.width}x${img.height}px`,
        });
      } else {
        resolve({ valid: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'Failed to load image for validation',
      });
    };

    img.src = objectUrl;
  });
}

export function validateSVG(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    if (file.type !== 'image/svg+xml') {
      resolve({ valid: true });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const svgContent = e.target?.result as string;

      // Basic SVG validation
      if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
        resolve({
          valid: false,
          error: 'Invalid SVG file structure',
        });
        return;
      }

      // Check for XML declaration or SVG namespace
      if (!svgContent.includes('xmlns') && !svgContent.includes('xmlns:svg')) {
        resolve({
          valid: false,
          error: 'SVG file missing required namespace',
        });
        return;
      }

      resolve({ valid: true });
    };

    reader.onerror = () => {
      resolve({
        valid: false,
        error: 'Failed to read SVG file',
      });
    };

    reader.readAsText(file);
  });
}

export async function validateFile(file: File): Promise<ValidationResult> {
  // Validate format
  const formatCheck = validateFileFormat(file);
  if (!formatCheck.valid) {
    return formatCheck;
  }

  // Validate size
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) {
    return sizeCheck;
  }

  // Validate dimensions (for raster images)
  if (file.type !== 'image/svg+xml') {
    const dimensionCheck = await validateImageDimensions(file);
    if (!dimensionCheck.valid) {
      return dimensionCheck;
    }
  } else {
    // Validate SVG structure
    const svgCheck = await validateSVG(file);
    if (!svgCheck.valid) {
      return svgCheck;
    }
  }

  return { valid: true };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
