"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { UploadCloud, Loader2, ZoomIn, ZoomOut, Crop } from "lucide-react";

type AspectRatioPreset = "16:9" | "4:3" | "1:1" | "3:2" | "custom";

const PRESETS: { label: AspectRatioPreset; w: number; h: number }[] = [
  { label: "16:9", w: 16, h: 9 },
  { label: "4:3", w: 4, h: 3 },
  { label: "1:1", w: 1, h: 1 },
  { label: "3:2", w: 3, h: 2 },
];

export default function CropTool() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioPreset>("16:9");
  const [customRatio, setCustomRatio] = useState({ w: 5, h: 4 });
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [quality, setQuality] = useState(85);
  const [isProcessing, setIsProcessing] = useState(false);

  const cropContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentRatio =
    selectedRatio === "custom"
      ? customRatio
      : PRESETS.find((p) => p.label === selectedRatio)!;

  const loadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageFile(file);

    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = url;
  }, []);

  const fitImageToContainer = useCallback(() => {
    if (!imageNaturalSize.w || !cropContainerRef.current) return;

    const containerW = cropContainerRef.current.clientWidth;
    const containerH = containerW * (currentRatio.h / currentRatio.w);

    const zoomX = containerW / imageNaturalSize.w;
    const zoomY = containerH / imageNaturalSize.h;
    const fitZoom = Math.min(zoomX, zoomY);

    const imgDispW = imageNaturalSize.w * fitZoom;
    const imgDispH = imageNaturalSize.h * fitZoom;
    const newOffsetX = (containerW - imgDispW) / 2;
    const newOffsetY = (containerH - imgDispH) / 2;

    setZoom(parseFloat(fitZoom.toFixed(4)));
    setOffsetX(newOffsetX);
    setOffsetY(newOffsetY);
  }, [imageNaturalSize, currentRatio]);

  useEffect(() => {
    fitImageToContainer();
  }, [fitImageToContainer]);

  const clampOffset = useCallback(
    (x: number, y: number) => {
      if (!cropContainerRef.current) return { x, y };
      const containerW = cropContainerRef.current.clientWidth;
      const containerH = containerW * (currentRatio.h / currentRatio.w);
      const imgW = imageNaturalSize.w * zoom;
      const imgH = imageNaturalSize.h * zoom;

      let clampedX = x;
      let clampedY = y;

      if (imgW <= containerW) {
        clampedX = (containerW - imgW) / 2;
      } else {
        clampedX = Math.max(-(imgW - containerW), Math.min(0, x));
      }

      if (imgH <= containerH) {
        clampedY = (containerH - imgH) / 2;
      } else {
        clampedY = Math.max(-(imgH - containerH), Math.min(0, y));
      }

      return { x: clampedX, y: clampedY };
    },
    [currentRatio, imageNaturalSize, zoom]
  );

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
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        loadImage(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadImage(e.target.files[0]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageUrl) return;
    e.preventDefault();
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage || !imageUrl) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const clamped = clampOffset(newX, newY);
    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  const handleMouseUp = () => {
    setIsDraggingImage(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    if (!imageUrl || !cropContainerRef.current) return;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta));

    const rect = cropContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomRatio = newZoom / zoom;
    const newX = mouseX - zoomRatio * (mouseX - offsetX);
    const newY = mouseY - zoomRatio * (mouseY - offsetY);

    const clamped = clampOffset(newX, newY);
    setZoom(newZoom);
    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom));
    const zoomRatio = clampedZoom / zoom;
    const containerW = cropContainerRef.current?.clientWidth || 0;
    const containerH = containerW * (currentRatio.h / currentRatio.w);
    const newX = zoomRatio * offsetX + (containerW * (1 - zoomRatio)) / 2;
    const newY = zoomRatio * offsetY + (containerH * (1 - zoomRatio)) / 2;
    const clamped = clampOffset(newX, newY);
    setZoom(clampedZoom);
    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  const handleCrop = async () => {
    if (!imageFile || !cropContainerRef.current) return;
    setIsProcessing(true);

    const containerW = cropContainerRef.current.clientWidth;
    const containerH = containerW * (currentRatio.h / currentRatio.w);

    const crop = {
      left: Math.round(Math.max(0, -offsetX / zoom)),
      top: Math.round(Math.max(0, -offsetY / zoom)),
      width: Math.round(Math.min(imageNaturalSize.w, containerW / zoom)),
      height: Math.round(Math.min(imageNaturalSize.h, containerH / zoom)),
    };

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("left", crop.left.toString());
    formData.append("top", crop.top.toString());
    formData.append("width", crop.width.toString());
    formData.append("height", crop.height.toString());
    formData.append("quality", quality.toString());

    try {
      const response = await fetch("/api/crop", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to crop image");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileNameWithoutExt =
        imageFile.name.substring(0, imageFile.name.lastIndexOf(".")) || imageFile.name;
      a.download = `${fileNameWithoutExt}_cropped.avif`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while processing the image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {!imageUrl ? (
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
          <p className="text-gray-400 text-sm">Select an image to crop, compress & convert to AVIF</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Crop Viewport */}
          <div
            ref={cropContainerRef}
            style={{ aspectRatio: `${currentRatio.w} / ${currentRatio.h}` }}
            className="w-full relative overflow-hidden rounded-xl bg-black/40 border-2 border-purple-500/30 select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <img
              src={imageUrl}
              alt="Crop preview"
              draggable={false}
              style={{
                transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                transformOrigin: "0 0",
              }}
              className={`absolute top-0 left-0 max-w-none ${isDraggingImage ? "cursor-grabbing" : "cursor-grab"}`}
            />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-[33.33%] top-0 bottom-0 w-px bg-white/15" />
              <div className="absolute left-[66.66%] top-0 bottom-0 w-px bg-white/15" />
              <div className="absolute top-[33.33%] left-0 right-0 h-px bg-white/15" />
              <div className="absolute top-[66.66%] left-0 right-0 h-px bg-white/15" />
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-purple-400/60 rounded-tl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-purple-400/60 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-purple-400/60 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-purple-400/60 rounded-br" />
            </div>

            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs text-gray-300 pointer-events-none">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setSelectedRatio(preset.label)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedRatio === preset.label
                      ? "bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      : "bg-white/5 text-gray-300 border-white/10 hover:border-purple-400/30 hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => setSelectedRatio("custom")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  selectedRatio === "custom"
                    ? "bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    : "bg-white/5 text-gray-300 border-white/10 hover:border-purple-400/30 hover:text-white"
                }`}
              >
                Custom
              </button>
            </div>
            {selectedRatio === "custom" && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customRatio.w}
                  onChange={(e) =>
                    setCustomRatio((prev) => ({
                      ...prev,
                      w: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center focus:outline-none focus:border-purple-500"
                />
                <span className="text-gray-400 text-sm">:</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={customRatio.h}
                  onChange={(e) =>
                    setCustomRatio((prev) => ({
                      ...prev,
                      h: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center focus:outline-none focus:border-purple-500"
                />
              </div>
            )}
          </div>

          {/* Zoom */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Zoom</label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-8">
                {(zoom * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min={10}
                max={500}
                value={Math.round(zoom * 100)}
                onChange={(e) => handleZoomChange(parseInt(e.target.value) / 100)}
                className="flex-1 accent-purple-500 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 
                  [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.5)]
                  [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <button
                onClick={() => handleZoomChange(zoom - 0.1)}
                disabled={zoom <= 0.1}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoomChange(zoom + 0.1)}
                disabled={zoom >= 5}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">
              Quality <span className="text-purple-400">{quality}</span>
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full accent-purple-500 h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500 
                [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(168,85,247,0.5)]
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Smaller</span>
              <span>Better Quality</span>
            </div>
          </div>

          <button
            onClick={handleCrop}
            disabled={isProcessing}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-lg
              ${isProcessing
                ? "bg-purple-500/50 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:-translate-y-1"
              }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crop className="w-5 h-5" />
                Crop & Download AVIF
              </>
            )}
          </button>

          <p className="text-center text-gray-500 text-xs">
            Drag image to reposition &bull; Ctrl+Scroll to zoom &bull; Rule of thirds
            guides
          </p>
        </div>
      )}
    </div>
  );
}
