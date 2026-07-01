"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Loader2, X, FileArchive } from "lucide-react";

export default function CompressTool() {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
    } catch (error) {
      console.error(error);
      alert("Something went wrong while processing images.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div
        className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
          ${isDragging ? "border-purple-500 bg-purple-500/10 scale-[1.02]" : "border-white/20 hover:border-purple-400/50 hover:bg-white/5"}`}
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
        <div className="bg-white/5 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
          <UploadCloud
            className={`w-10 h-10 ${isDragging ? "text-purple-400" : "text-gray-400 group-hover:text-purple-400"}`}
          />
        </div>
        <p className="text-white font-semibold text-xl mb-2">Click to upload or drag and drop</p>
        <p className="text-gray-400 text-sm">Supports JPG, PNG, WEBP, and TIFF</p>
      </div>

      {files.length > 0 && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-200">
              Selected Files{" "}
              <span className="text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-md ml-2">
                {files.length}
              </span>
            </h3>
          </div>
          <ul className="max-h-60 overflow-y-auto space-y-2 mb-8 pr-2 custom-scrollbar">
            {files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate text-sm text-gray-300">{file.name}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 p-1.5 rounded-lg transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-lg
              ${isUploading
                ? "bg-purple-500/50 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:-translate-y-1"
              }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Compressing...
              </>
            ) : (
              <>
                <FileArchive className="w-5 h-5" />
                Compress & Download Zip
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
