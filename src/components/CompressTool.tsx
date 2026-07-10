"use client";

import { useState, useRef, useMemo } from "react";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  X,
  FileArchive,
  SlidersHorizontal,
  CheckCircle,
} from "lucide-react";
import { showToast } from "@/components/Toast";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CompressTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [quality, setQuality] = useState(85);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thumbnails = useMemo(() => {
    return files.map((file) => URL.createObjectURL(file));
  }, [files]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const imageFiles = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (imageFiles.length > 0) {
        setFiles((prev) => [...prev, ...imageFiles]);
        setShowSuccess(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      setShowSuccess(false);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(thumbnails[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    try {
      let compressedCount = 0;

      for (const file of files) {
        await new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          const objUrl = URL.createObjectURL(file);
          img.src = objUrl;

          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            
            if (!ctx) {
              reject(new Error("Could not get canvas context"));
              return;
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob(
              (blob) => {
                URL.revokeObjectURL(objUrl);
                if (!blob) {
                  reject(new Error(`Failed to compress ${file.name}`));
                  return;
                }

                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                const fileNameWithoutExt =
                  file.name.substring(0, file.name.lastIndexOf(".")) ||
                  file.name;
                a.download = `${fileNameWithoutExt}_compressed.webp`;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(blobUrl);
                a.remove();
                
                compressedCount++;
                resolve();
              },
              "image/webp",
              quality / 100
            );
          };

          img.onerror = () => {
            URL.revokeObjectURL(objUrl);
            reject(new Error(`Failed to load ${file.name}`));
          };
        });
        
        // Small delay between processing large files to allow UI to update and garbage collector to run
        await new Promise((r) => setTimeout(r, 200));
      }

      // Revoke all thumbnail URLs
      thumbnails.forEach((t) => URL.revokeObjectURL(t));
      setFiles([]);
      setShowSuccess(true);
      showToast(
        `Compressed ${compressedCount} file${compressedCount > 1 ? "s" : ""} successfully`,
        "success"
      );
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Something went wrong while processing images.");
    } finally {
      setIsUploading(false);
    }
  };

  const qualityProgress = `${quality}%`;

  return (
    <div>
      {/* ─── Drop Zone ─── */}
      <div
        className={`relative rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group border-2 border-dashed ${
          isDragging
            ? "border-accent bg-accent/[0.08] scale-[1.01]"
            : "border-white/[0.08] hover:border-accent/40 hover:bg-white/[0.02]"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        <div
          className={`mb-4 p-4 rounded-2xl transition-all duration-500 ${
            isDragging
              ? "bg-accent/20 scale-110 animate-pulse-glow"
              : "bg-white/[0.04] group-hover:bg-accent/10 group-hover:scale-105"
          }`}
        >
          <UploadCloud
            className={`w-10 h-10 transition-all duration-300 ${
              isDragging
                ? "text-accent"
                : "text-text-tertiary group-hover:text-accent"
            }`}
          />
        </div>

        <p className="text-text-primary font-semibold text-lg mb-1">
          Drop images here
        </p>
        <p className="text-text-tertiary text-sm mb-4">or click to browse</p>
        <span className="inline-flex items-center gap-2 text-xs text-text-tertiary bg-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.06]">
          JPG · PNG · WEBP · TIFF
        </span>
      </div>

      {/* ─── Success State ─── */}
      {showSuccess && files.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center py-8 animate-fade-in-up">
          <div className="p-3 rounded-full bg-success/10 mb-3">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <p className="text-text-primary font-medium">
            Download complete!
          </p>
          <p className="text-text-tertiary text-sm mt-1">
            Drop more images to continue
          </p>
        </div>
      )}

      {/* ─── File List + Controls ─── */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4 animate-fade-in-up">
          {/* File count header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-secondary">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                thumbnails.forEach((t) => URL.revokeObjectURL(t));
                setFiles([]);
              }}
              className="text-xs text-text-tertiary hover:text-danger transition-colors"
            >
              Clear all
            </button>
          </div>

          {/* File list with thumbnails */}
          <ul className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 bg-white/[0.03] px-3 py-2.5 rounded-xl border border-white/[0.06] hover:border-accent/20 transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Thumbnail */}
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-white/[0.05] shrink-0 ring-1 ring-white/[0.06]">
                  <img
                    src={thumbnails[idx]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* File info */}
                <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                  <span className="truncate text-sm text-text-primary font-medium">
                    {file.name}
                  </span>
                  <span className="text-[11px] text-text-tertiary">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                {/* Remove */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="shrink-0 text-text-tertiary hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-all duration-200"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>

          {/* Quality Slider */}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Quality
                </span>
              </div>
              <span className="text-sm font-mono font-semibold text-accent tabular-nums">
                {quality}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="styled-range w-full"
              style={
                { "--range-progress": qualityProgress } as React.CSSProperties
              }
            />
            <div className="flex justify-between text-[11px] text-text-tertiary mt-2">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="btn-gradient w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Compressing...
              </>
            ) : (
              <>
                <FileArchive className="w-4 h-4" />
                Compress & Download
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
