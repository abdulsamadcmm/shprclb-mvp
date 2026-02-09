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
  const [localPreview, setLocalPreview] = useState<string | null>(null); // Local file preview before upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store selected file
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // Validate file
    const validation = await validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    // Create local preview immediately (before upload)
    try {
      const previewUrl = await fileToBase64(file);
      setLocalPreview(previewUrl);
      setSelectedFile(file); // Store file in state
    } catch (err) {
      setError('Failed to read file');
    }
  };

  const handleUpload = async () => {
    if (!localPreview || !selectedFile) {
      setError('File not found');
      return;
    }

    setIsUploading(true);

    try {
      // Upload to BFF
      const response = await fetch(`${BFF_URL}/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_data: localPreview,
          file_name: selectedFile.name,
          mime_type: selectedFile.type,
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
    setError(null);
    onDesignChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    setLocalPreview(null);
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePlacementChange = (newPlacement: 'front' | 'back') => {
    setPlacement(newPlacement);
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
          Upload your design for the front or back. Max 5MB, min 500x500px (JPG, PNG, SVG)
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

      {/* Preview with Shirt Overlay */}
      {localPreview && !design && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="text-sm font-medium">Preview</div>
          
          {/* Shirt with Design Overlay */}
          <div className="relative w-full aspect-square max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
            {productImage ? (
              <>
                {/* Shirt Image */}
                <img
                  src={productImage}
                  alt="Product"
                  className="w-full h-full object-contain"
                />
                {/* Design Overlay */}
                <div
                  className={`absolute inset-0 flex items-center justify-center ${
                    placement === 'front' ? '' : 'scale-x-[-1]'
                  }`}
                  style={{
                    backgroundImage: `url(${localPreview})`,
                    backgroundSize: '60%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    mixBlendMode: 'multiply',
                  }}
                />
              </>
            ) : (
              /* Fallback: Just show design if no product image */
              <img
                src={localPreview}
                alt="Design preview"
                className="w-full h-full object-contain"
              />
            )}
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
                'Upload Design'
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
