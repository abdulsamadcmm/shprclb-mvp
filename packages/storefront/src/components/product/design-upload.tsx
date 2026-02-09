"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { validateFile, fileToBase64 } from "@/lib/file-validation";

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001';

export interface DesignInfo {
  file_url: string;
  file_id: string;
  placement: 'front' | 'back';
  file_name: string;
  file_size: number;
}

interface DesignUploadProps {
  onDesignChange: (design: DesignInfo | null) => void;
  initialDesign?: DesignInfo | null;
  disabled?: boolean;
  productImage?: string | null; // Product/shirt image for preview overlay
}

// Helper function to fetch an image through proxy and convert to data URL to bypass CORS
async function fetchImageAsDataUrl(url: string): Promise<string> {
  const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:3001';
  
  try {
    // Use BFF proxy endpoint to bypass CORS
    const proxyUrl = `${BFF_URL}/files/proxy-image?url=${encodeURIComponent(url)}`;
    console.log('Fetching image through proxy:', proxyUrl);
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('Proxy fetch failed:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const blob = await response.blob();
    console.log('Image fetched successfully, blob size:', blob.size);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('Image converted to data URL successfully');
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        console.error('Failed to convert blob to data URL');
        reject(new Error('Failed to convert blob to data URL'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to fetch image through proxy:', error);
    throw error;
  }
}

// Helper function to load an image from a URL or File
function loadImage(source: string | File): Promise<HTMLImageElement> {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Ensure image is fully loaded
      if (img.complete && img.naturalWidth > 0) {
        resolve(img);
      } else {
        reject(new Error('Image failed to load completely'));
      }
    };
    
    img.onerror = (err) => {
      reject(new Error(`Failed to load image: ${err}`));
    };
    
    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(source);
    } else {
      // For external URLs, always use proxy to bypass CORS
      if (source.startsWith('http://') || source.startsWith('https://')) {
        // Always fetch through proxy to avoid CORS issues
        fetchImageAsDataUrl(source)
          .then((dataUrl) => {
            img.src = dataUrl;
          })
          .catch((error) => {
            console.error('Failed to fetch image through proxy:', error);
            reject(new Error(`Failed to load image: ${error}`));
          });
      } else {
        // Local URL (relative path), load directly
        img.src = source;
      }
    }
  });
}

// Helper function to resize an image while maintaining aspect ratio
function resizeImage(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let { width, height } = img;
  
  // Calculate scaling factor to fit within max dimensions
  const scale = Math.min(maxWidth / width, maxHeight / height);
  
  return {
    width: width * scale,
    height: height * scale,
  };
}

// Create a resized version of the design image on a separate canvas
function createResizedDesignCanvas(
  designImg: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { alpha: true }); // Enable alpha channel for transparency
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate size maintaining aspect ratio
  const size = resizeImage(designImg, targetWidth, targetHeight);
  canvas.width = size.width;
  canvas.height = size.height;

  // Clear canvas with transparent background (important for preserving PNG transparency)
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the resized design - PNG transparency will be preserved
  ctx.drawImage(designImg, 0, 0, size.width, size.height);
  
  return canvas;
}

// Create composite image: product image as base, custom design overlaid on top
async function createCompositeImage(
  productImageUrl: string | null,
  designImageFile: File,
  placement: 'front' | 'back'
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true }); // Enable alpha channel for transparency
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Load product image first
      let productImg: HTMLImageElement | null = null;
      if (productImageUrl) {
        try {
          console.log('Loading product image:', productImageUrl);
          productImg = await loadImage(productImageUrl);
          console.log('Product image loaded successfully:', productImg.width, 'x', productImg.height);
        } catch (err) {
          console.error('Failed to load product image, using white background', err);
          // Don't throw - we'll use white background instead
        }
      }

      // Load design image
      const designImg = await loadImage(designImageFile);
      console.log('Design image loaded:', designImg.width, 'x', designImg.height);

      // Set canvas size to product image size, or use design size if no product image
      if (productImg) {
        canvas.width = productImg.width;
        canvas.height = productImg.height;
      } else {
        // Default size if no product image
        canvas.width = 1000;
        canvas.height = 1000;
      }

      // Draw product image as base layer
      if (productImg) {
        ctx.drawImage(productImg, 0, 0, canvas.width, canvas.height);
      } else {
        // White background if no product image
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Reduce design size significantly - make it smaller (30-40% of product image)
      const designScaleFactor = 0.35; // 35% of product image size
      const maxDesignWidth = canvas.width * designScaleFactor;
      const maxDesignHeight = canvas.height * designScaleFactor;
      
      // Create resized design canvas first - this reduces the design size
      const resizedDesignCanvas = createResizedDesignCanvas(
        designImg,
        maxDesignWidth,
        maxDesignHeight
      );
      console.log('Resized design canvas:', resizedDesignCanvas.width, 'x', resizedDesignCanvas.height);
      console.log('Canvas size:', canvas.width, 'x', canvas.height);

      // Calculate position to center the design on the product image
      const designX = (canvas.width - resizedDesignCanvas.width) / 2;
      const designY = (canvas.height - resizedDesignCanvas.height) / 2;
      console.log('Design position:', designX, designY);

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Don't set globalAlpha - preserve PNG transparency naturally
      // The PNG's alpha channel will be preserved when drawing, allowing transparent backgrounds

      // Save context for transformations
      ctx.save();

      // Flip horizontally if placement is 'back'
      if (placement === 'back') {
        // Translate to the right edge, then flip horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        // Draw resized design flipped - PNG transparency preserved
        ctx.drawImage(
          resizedDesignCanvas,
          -designX - resizedDesignCanvas.width,
          designY,
          resizedDesignCanvas.width,
          resizedDesignCanvas.height
        );
      } else {
        // Draw resized design normally for 'front' - on top of product image
        // PNG transparency preserved, transparent background will show through to product image
        ctx.drawImage(
          resizedDesignCanvas,
          designX,
          designY,
          resizedDesignCanvas.width,
          resizedDesignCanvas.height
        );
      }

      // Restore context
      ctx.restore();

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        'image/png',
        0.95
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Convert blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function DesignUpload({
  onDesignChange,
  initialDesign,
  disabled = false,
  productImage,
}: DesignUploadProps) {
  const [design, setDesign] = useState<DesignInfo | null>(initialDesign || null);
  const [placement, setPlacement] = useState<'front' | 'back'>('front');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(
    initialDesign?.file_url || null
  );
  const [localPreview, setLocalPreview] = useState<string | null>(null); // Composite preview before upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store selected design file
  const [compositeBlob, setCompositeBlob] = useState<Blob | null>(null); // Store composite image blob
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file
    const validation = await validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Store selected file
    setSelectedFile(file);

    // Create composite preview if product image is available
    if (productImage) {
      try {
        setIsUploading(true);
        const composite = await createCompositeImage(productImage, file, placement);
        const previewUrl = await blobToBase64(composite);
        setLocalPreview(previewUrl);
        setCompositeBlob(composite);
      } catch (err) {
        console.error('Failed to create composite preview:', err);
        setError('Failed to create preview. Please try again.');
        setSelectedFile(null);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Fallback: just show the design file if no product image
      try {
        const previewUrl = await fileToBase64(file);
        setLocalPreview(previewUrl);
      } catch (err) {
        setError('Failed to read file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!localPreview || !selectedFile) {
      setError('File not found');
      return;
    }

    setIsUploading(true);

    try {
      // Use composite blob if available, otherwise fallback to original file
      let fileToUpload: Blob;
      let fileName: string;
      let mimeType: string;

      if (compositeBlob) {
        // Upload composite image
        fileToUpload = compositeBlob;
        fileName = `composite-${selectedFile.name.replace(/\.[^/.]+$/, '')}.png`;
        mimeType = 'image/png';
      } else {
        // Fallback: upload original file (when no product image)
        fileToUpload = selectedFile;
        fileName = selectedFile.name;
        mimeType = selectedFile.type;
      }

      // Convert blob to base64 for upload
      const fileData = await blobToBase64(fileToUpload);

      // Upload to BFF
      const response = await fetch(`${BFF_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_data: fileData,
          file_name: fileName,
          mime_type: mimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }

      const uploadResult = await response.json();

      // Store only the path in custom_design.file_url; resolve with base URL only when displaying
      const designInfo: DesignInfo = {
        file_url: uploadResult.file_url,
        file_id: uploadResult.file_id,
        placement,
        file_name: uploadResult.file_name,
        file_size: uploadResult.file_size,
      };

      setDesign(designInfo);
      const medusaBaseUrl = process.env.NEXT_PUBLIC_MEDUSA_URL || 'http://localhost:9000';
      const previewFullUrl = designInfo.file_url.startsWith('http')
        ? designInfo.file_url
        : `${medusaBaseUrl}${designInfo.file_url}`;
      setPreview(previewFullUrl);
      setLocalPreview(null); // Clear local preview after upload
      setCompositeBlob(null); // Clear composite blob
      onDesignChange(designInfo);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setDesign(null);
    setPreview(null);
    setLocalPreview(null);
    setSelectedFile(null);
    setCompositeBlob(null);
    setError(null);
    onDesignChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    setLocalPreview(null);
    setSelectedFile(null);
    setCompositeBlob(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlacementChange = async (newPlacement: 'front' | 'back') => {
    setPlacement(newPlacement);
    
    // Update preview if we have a selected file
    if (selectedFile && productImage) {
      try {
        setIsUploading(true);
        const composite = await createCompositeImage(productImage, selectedFile, newPlacement);
        const previewUrl = await blobToBase64(composite);
        setLocalPreview(previewUrl);
        setCompositeBlob(composite);
      } catch (err) {
        console.error('Failed to update preview:', err);
        setError('Failed to update preview');
      } finally {
        setIsUploading(false);
      }
    }
    
    if (design) {
      const updatedDesign = { ...design, placement: newPlacement };
      setDesign(updatedDesign);
      onDesignChange(updatedDesign);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Custom Design (Optional)</label>
        <p className="text-xs text-muted-foreground">
          Upload your design for the front or back. Max 5MB, min 500x500px (JPG, PNG, SVG). 
          Your design will be automatically overlaid on the product image and uploaded as a composite image.
        </p>
      </div>

      {/* Placement Selection */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={placement === 'front' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePlacementChange('front')}
          disabled={disabled || isUploading}
        >
          Front
        </Button>
        <Button
          type="button"
          variant={placement === 'back' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePlacementChange('back')}
          disabled={disabled || isUploading}
        >
          Back
        </Button>
      </div>

      {/* Upload Area */}
      {!design && !localPreview && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            disabled || isUploading
              ? 'border-muted bg-muted/50 cursor-not-allowed'
              : 'border-border hover:border-foreground/50 cursor-pointer'
          }`}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/svg+xml"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, or SVG (max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview with Composite Image */}
      {localPreview && !design && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium">Preview - Composite Image</div>
          <p className="text-xs text-muted-foreground">
            This preview shows how your design will appear on the product. The uploaded image will be this composite.
          </p>
          
          {/* Composite Image Preview */}
          <div className="relative w-full aspect-square max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
            <img
              src={localPreview}
              alt="Composite preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={disabled || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Composite Image'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelPreview}
              disabled={disabled || isUploading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Design Preview */}
      {design && preview && (
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{design.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {(design.file_size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Placement: {design.placement === 'front' ? 'Front' : 'Back'}
            </Badge>
          </div>

          <div className="rounded-lg overflow-hidden bg-muted">
            <img
              src={preview}
              alt="Design preview"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
