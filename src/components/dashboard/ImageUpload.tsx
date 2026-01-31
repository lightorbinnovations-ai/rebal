import { useState, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Compression options for optimal balance of quality and size
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1, // Max file size in MB
  maxWidthOrHeight: 1920, // Max dimension
  useWebWorker: true, // Use web worker for better performance
  fileType: "image/webp" as const, // Convert to WebP for better compression
  initialQuality: 0.85, // Quality setting (0-1)
};

// For thumbnails/smaller images
const THUMBNAIL_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 800,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.8,
};

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
  aspectRatio?: "video" | "square";
  disabled?: boolean;
  folder?: string;
  thumbnail?: boolean; // Use smaller compression for thumbnails
}

export const ImageUpload = ({
  value,
  onChange,
  onRemove,
  className,
  aspectRatio = "video",
  disabled = false,
  folder = "properties",
  thumbnail = false,
}: ImageUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  const compressImage = async (file: File): Promise<File> => {
    const options = thumbnail ? THUMBNAIL_COMPRESSION_OPTIONS : COMPRESSION_OPTIONS;
    
    try {
      setUploadStatus("Compressing...");
      const compressedFile = await imageCompression(file, options);
      
      // Log compression results for debugging
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
      console.log(`Image compressed: ${originalSize}MB → ${compressedSize}MB (${savings}% smaller)`);
      
      return compressedFile;
    } catch (error) {
      console.error("Compression failed, using original:", error);
      return file;
    }
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, WebP, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Increased limit since we'll compress anyway
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to upload images");
      }

      // Compress the image before upload
      const compressedFile = await compressImage(file);
      
      setUploadStatus("Uploading...");
      
      // Use .webp extension since we convert to WebP
      const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(fileName, compressedFile, {
          cacheControl: "31536000", // 1 year cache for optimized images
          upsert: false,
          contentType: "image/webp",
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("property-images")
        .getPublicUrl(fileName);

      onChange(publicUrl);

      const savedSize = ((file.size - compressedFile.size) / 1024).toFixed(0);
      toast({
        title: "Image uploaded",
        description: `Optimized and uploaded (saved ${savedSize}KB)`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadStatus("");
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        uploadFile(files[0]);
      }
    },
    [disabled, isUploading]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleRemove = async () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange("");
    }
  };

  return (
    <div className={cn("relative", className)}>
      {value ? (
        <div
          className={cn(
            "relative rounded-lg overflow-hidden bg-muted group",
            aspectRatio === "video" ? "aspect-video" : "aspect-square"
          )}
        >
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="pointer-events-none"
                >
                  Replace
                </Button>
              </label>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <label
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            aspectRatio === "video" ? "aspect-video" : "aspect-square",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={disabled || isUploading}
          />
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{uploadStatus || "Processing..."}</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-muted p-3">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Drop image here or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WebP up to 20MB (auto-optimized)
                  </p>
                </div>
              </>
            )}
          </div>
        </label>
      )}
    </div>
  );
};

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  folder?: string;
}

export const MultiImageUpload = ({
  value = [],
  onChange,
  maxImages = 10,
  disabled = false,
  folder = "gallery",
}: MultiImageUploadProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const compressImage = async (file: File): Promise<File> => {
    try {
      const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
      return compressedFile;
    } catch (error) {
      console.error("Compression failed, using original:", error);
      return file;
    }
  };

  const uploadFiles = async (files: FileList) => {
    // Convert FileList to array immediately to avoid browser issues
    const filesArray = Array.from(files);
    console.log(`MultiImageUpload: Received ${filesArray.length} files`);
    
    const validFiles = filesArray.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 20MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    console.log(`MultiImageUpload: ${validFiles.length} valid files after filtering`);

    if (validFiles.length === 0) return;

    const remainingSlots = maxImages - value.length;
    if (validFiles.length > remainingSlots) {
      toast({
        title: "Too many images",
        description: `You can only add ${remainingSlots} more image(s). Selected first ${remainingSlots}.`,
        variant: "destructive",
      });
      // Trim to remaining slots instead of rejecting all
      validFiles.splice(remainingSlots);
    }

    setIsUploading(true);
    let totalSaved = 0;
    const uploadedUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to upload images");
      }

      // Upload files sequentially to avoid race conditions and show proper progress
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        
        setUploadProgress(`Compressing ${i + 1}/${validFiles.length}...`);
        
        const originalSize = file.size;
        const compressedFile = await compressImage(file);
        totalSaved += originalSize - compressedFile.size;
        
        setUploadProgress(`Uploading ${i + 1}/${validFiles.length}...`);
        
        const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.webp`;

        const { error } = await supabase.storage
          .from("property-images")
          .upload(fileName, compressedFile, {
            cacheControl: "31536000",
            upsert: false,
            contentType: "image/webp",
          });

        if (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          toast({
            title: "Upload error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue; // Continue with other files
        }

        const { data: { publicUrl } } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
        console.log(`MultiImageUpload: Uploaded ${i + 1}/${validFiles.length}: ${file.name}`);
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);

        const savedMB = (totalSaved / 1024 / 1024).toFixed(1);
        toast({
          title: "Images uploaded",
          description: `${uploadedUrls.length} image(s) optimized & uploaded (saved ${savedMB}MB)`,
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
    e.target.value = "";
  };

  const removeImage = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {value.map((url, index) => (
            <div
              key={index}
              className="relative aspect-video rounded-lg overflow-hidden bg-muted group"
            >
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {value.length < maxImages && (
        <label
          className={cn(
            "flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
            "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileInput}
            disabled={disabled || isUploading}
          />
          {isUploading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{uploadProgress || "Processing..."}</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Add images ({value.length}/{maxImages}) - auto-optimized
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
};
