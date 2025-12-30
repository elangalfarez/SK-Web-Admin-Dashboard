// src/components/shared/image-uploader.tsx
// Created: Image uploader component with drag-and-drop and preview

"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadImage, deleteFileByUrl, normalizeBucket, type StorageBucket, type StorageBucketLower } from "@/lib/supabase/storage";
import { UPLOAD } from "@/lib/constants";

// Allow either uppercase or lowercase bucket names
type BucketProp = StorageBucket | StorageBucketLower;

// ============================================================================
// TYPES
// ============================================================================

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  bucket: BucketProp;
  folder?: string;
  maxImages?: number;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
}

interface UploadingImage {
  id: string;
  file: File;
  preview: string;
  progress: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ImageUploader({
  value = [],
  onChange,
  bucket,
  folder = "",
  maxImages = 10,
  maxSize = UPLOAD.MAX_IMAGE_SIZE,
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState<UploadingImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      // Validate file count
      if (value.length + fileArray.length > maxImages) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Filter valid images
      const validFiles = fileArray.filter((file) => {
        if (!UPLOAD.ACCEPTED_IMAGE_TYPES.includes(file.type as typeof UPLOAD.ACCEPTED_IMAGE_TYPES[number])) {
          setError(`Invalid file type: ${file.name}`);
          return false;
        }
        if (file.size > maxSize) {
          setError(`File too large: ${file.name} (max ${maxSize / 1024 / 1024}MB)`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      // Create upload previews
      const newUploading: UploadingImage[] = validFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
      }));

      setUploading((prev) => [...prev, ...newUploading]);

      // Upload files
      const uploadPromises = newUploading.map(async (item) => {
        try {
          const result = await uploadImage(item.file, { bucket: normalizeBucket(bucket), folder });
          
          if (result.success && result.url) {
            return result.url;
          } else {
            setError(result.error || "Upload failed");
            return null;
          }
        } catch (err) {
          setError("Upload failed");
          return null;
        } finally {
          // Clean up preview
          URL.revokeObjectURL(item.preview);
          setUploading((prev) => prev.filter((u) => u.id !== item.id));
        }
      });

      const results = await Promise.all(uploadPromises);
      const successUrls = results.filter((url): url is string => url !== null);

      if (successUrls.length > 0) {
        onChange([...value, ...successUrls]);
      }
    },
    [value, onChange, bucket, folder, maxImages, maxSize]
  );

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  // Handle remove image
  const handleRemove = async (url: string) => {
    // Remove from state immediately for UX
    onChange(value.filter((u) => u !== url));

    // Delete from storage in background
    try {
      await deleteFileByUrl(normalizeBucket(bucket), url);
    } catch (err) {
      console.error("Failed to delete image:", err);
    }
  };

  // Handle click to upload
  const handleClick = () => {
    inputRef.current?.click();
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input
      e.target.value = "";
    }
  };

  const canUpload = value.length < maxImages && !disabled;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Image grid */}
      {(value.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {/* Existing images */}
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Cover
                </span>
              )}
            </div>
          ))}

          {/* Uploading images */}
          {uploading.map((item) => (
            <div
              key={item.id}
              className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
            >
              <img
                src={item.preview}
                alt="Uploading"
                className="h-full w-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {canUpload && (
        <div
          className={cn(
            "relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 px-6 py-10 text-center transition-colors",
            isDragging && "border-primary bg-primary/5",
            disabled && "cursor-not-allowed opacity-50"
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={inputRef}
            type="file"
            accept={UPLOAD.ACCEPTED_IMAGE_TYPES.join(",")}
            multiple
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isDragging ? "Drop images here" : "Click or drag images"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP up to {maxSize / 1024 / 1024}MB
              </p>
              <p className="text-xs text-muted-foreground">
                {value.length}/{maxImages} images
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SINGLE IMAGE UPLOADER
// ============================================================================

interface SingleImageUploaderProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  bucket: BucketProp;
  folder?: string;
  maxSize?: number;
  aspectRatio?: "square" | "video" | "banner";
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function SingleImageUploader({
  value,
  onChange,
  bucket,
  folder = "",
  maxSize = UPLOAD.MAX_IMAGE_SIZE,
  aspectRatio = "video",
  className,
  disabled = false,
  placeholder = "Upload image",
}: SingleImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass = {
    square: "aspect-square",
    video: "aspect-video",
    banner: "aspect-[3/1]",
  }[aspectRatio];

  const handleFile = async (file: File) => {
    setError(null);

    // Validate
    if (!UPLOAD.ACCEPTED_IMAGE_TYPES.includes(file.type as typeof UPLOAD.ACCEPTED_IMAGE_TYPES[number])) {
      setError("Invalid file type");
      return;
    }
    if (file.size > maxSize) {
      setError(`File too large (max ${maxSize / 1024 / 1024}MB)`);
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadImage(file, { bucket: normalizeBucket(bucket), folder });

      if (result.success && result.url) {
        // Delete old image if exists
        if (value) {
          await deleteFileByUrl(normalizeBucket(bucket), value).catch(() => {});
        }
        onChange(result.url);
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value) {
      onChange(null);
      await deleteFileByUrl(normalizeBucket(bucket), value).catch(() => {});
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
      e.target.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors",
          aspectRatioClass,
          !value && !isUploading && "cursor-pointer hover:border-primary hover:bg-primary/5",
          disabled && "cursor-not-allowed opacity-50"
        )}
        onClick={!value ? handleClick : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD.ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {value ? (
          <>
            <img
              src={value}
              alt="Uploaded"
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleClick}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                >
                  Remove
                </Button>
              </div>
            )}
          </>
        ) : isUploading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          </div>
        )}
      </div>
    </div>
  );
}
