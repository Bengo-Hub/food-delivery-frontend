"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { toast } from "@/lib/toast";
import { apiErrorMessage } from "@/lib/api/error-message";
import { api } from "@/lib/api/base";

interface ImageUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
}

export function ImageUpload({ label, value, onChange, required }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB for menu items is plenty)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await api.post<{ url: string }>("/media/upload", formData);
      onChange(result.data.url);
      toast.success(`${label} uploaded`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(await apiErrorMessage(error, `Failed to upload ${label}`));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && "*"}
      </label>
      
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
          value 
            ? "border-primary/50 bg-primary/5 shadow-inner" 
            : "border-muted-foreground/20 bg-muted/30 hover:bg-muted/50"
        } ${uploading ? "cursor-not-allowed opacity-70" : ""}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-1.5">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">Uploading...</span>
          </div>
        ) : value ? (
          <>
            <img 
              src={value} 
              alt={label} 
              className="absolute inset-0 h-full w-full rounded-md object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100 rounded-md">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <button
              onClick={handleClear}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:scale-110 transition-transform"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 p-3 text-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-primary shadow-sm">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-foreground">Upload Photo</p>
              <p className="text-[9px] text-muted-foreground">JPG/PNG/WEBP (5MB)</p>
            </div>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
