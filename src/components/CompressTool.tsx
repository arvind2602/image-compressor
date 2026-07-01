"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Loader2, X, FileArchive, SlidersHorizontal } from "lucide-react";
import { showToast } from "@/components/Toast";

export default function CompressTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [quality, setQuality] = useState(85);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("quality", quality.toString());

    try {
      const response = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to compress images");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed_images.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setFiles([]);
      showToast(`Compressed ${files.length} file${files.length > 1 ? "s" : ""} successfully`, "success");
    } catch (error) {
      console.error(error);
      showToast("Something went wrong while processing images.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-14 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
          ${isDragging
            ? "border-accent bg-accent/10 scale-[1.02]"
            : "border-border hover:border-accent/50 hover:bg-surface-hover"}`}
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
        <div className={`mb-4 p-4 rounded-full transition-all duration-300 ${isDragging ? "bg-accent/20 scale-110" : "bg-surface-hover group-hover:bg-accent/10 group-hover:scale-110"}`}>
          <UploadCloud
            className={`w-10 h-10 transition-colors ${isDragging ? "text-accent" : "text-text-tertiary group-hover:text-accent"}`}
          />
        </div>
        <p className="text-text-primary font-medium text-lg mb-1">
          Drop images here
        </p>
        <p className="text-text-tertiary text-sm">or click to browse · JPG, PNG, WEBP, TIFF</p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-text-secondary">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </h3>
          </div>

          <ul className="max-h-60 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between bg-surface-hover px-3.5 py-2.5 rounded-lg border border-border hover:border-border-hover transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <ImageIcon className="w-4 h-4 text-text-tertiary shrink-0" />
                  <span className="truncate text-sm text-text-secondary">{file.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="shrink-0 text-text-tertiary hover:text-danger hover:bg-danger/10 p-1 rounded transition-colors"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="bg-surface-hover rounded-xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Quality
                </span>
              </div>
              <span className="text-xs text-accent font-mono">{quality}</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full accent-accent h-1 rounded-full appearance-none bg-white/10 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent
                [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(124,58,237,0.4)]
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent/30"
            />
            <div className="flex justify-between text-[11px] text-text-tertiary mt-1.5">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full h-11 rounded-xl font-medium text-sm text-white transition-all flex items-center justify-center gap-2
              ${isUploading
                ? "bg-accent/40 cursor-not-allowed"
                : "bg-accent hover:bg-accent-hover active:scale-[0.98]"
              }`}
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
