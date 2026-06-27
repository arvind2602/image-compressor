"use client";

import { useState, useRef } from "react";

export default function Home() {
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

      // Download the zip file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed_images.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      // Clear files after successful download
      setFiles([]);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while processing images.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Compressor (AVIF)</h1>
        <p className="text-gray-500 mb-8">Upload your images to compress and convert them to AVIF format automatically.</p>

        <div 
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
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
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
          <p className="text-gray-700 font-medium text-lg">Click to upload or drag and drop</p>
          <p className="text-gray-500 text-sm mt-1">JPG, PNG, WEBP, TIFF</p>
        </div>

        {files.length > 0 && (
          <div className="mt-8">
            <h3 className="font-semibold text-gray-800 mb-3">Selected Files ({files.length})</h3>
            <ul className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
              {files.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                  <span className="truncate text-sm text-gray-700 max-w-[80%]">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                </li>
              ))}
            </ul>
            
            <button 
              onClick={handleUpload} 
              disabled={isUploading}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-all
                ${isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}
            >
              {isUploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing & Compressing...
                </span>
              ) : 'Compress Images'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
