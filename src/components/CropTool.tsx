"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  UploadCloud,
  Loader2,
  ZoomIn,
  ZoomOut,
  Crop,
  Maximize2,
  SlidersHorizontal,
} from "lucide-react";
import { showToast } from "@/components/Toast";

type AspectRatioPreset = "16:9" | "4:3" | "1:1" | "3:2" | "custom";

const PRESETS: { label: AspectRatioPreset; w: number; h: number }[] = [
  { label: "16:9", w: 16, h: 9 },
  { label: "4:3", w: 4, h: 3 },
  { label: "1:1", w: 1, h: 1 },
  { label: "3:2", w: 3, h: 2 },
];

function getRatioDimensions(w: number, h: number, maxHeight: number) {
  const scale = maxHeight / Math.max(w, h);
  return { w: Math.round(w * scale), h: Math.round(h * scale) };
}

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

  const handleResetFit = () => {
    fitImageToContainer();
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

      showToast("Image cropped and converted successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Something went wrong while processing the image.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {!imageUrl ? (
        <div
          className={`border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center transition-all cursor-pointer group
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
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <div className={`mb-5 p-4 rounded-full transition-all duration-300 ${isDragging ? "bg-accent/20 scale-110" : "bg-surface-hover group-hover:bg-accent/10 group-hover:scale-110"}`}>
            <UploadCloud
              className={`w-12 h-12 transition-colors ${isDragging ? "text-accent" : "text-text-tertiary group-hover:text-accent"}`}
            />
          </div>
          <p className="text-text-primary font-medium text-lg mb-1.5">
            Drop an image here
          </p>
          <p className="text-text-tertiary text-sm mb-6">or click to browse</p>
          <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary bg-surface-hover px-3 py-1.5 rounded-full border border-border">
            JPG · PNG · WEBP · TIFF
          </span>
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          {/* Crop Viewport */}
          <div className="flex-1 min-w-0">
            <div className="relative group/viewport">
              <div
                ref={cropContainerRef}
                style={{ aspectRatio: `${currentRatio.w} / ${currentRatio.h}` }}
                className={`w-full relative overflow-hidden rounded-xl bg-black/60 ring-1 transition-all select-none
                  ${isDraggingImage
                    ? "ring-accent/70 ring-2"
                    : "ring-border group-hover/viewport:ring-border-hover"}`}
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
                  className={`absolute top-0 left-0 max-w-none transition-transform duration-75
                    ${isDraggingImage ? "cursor-grabbing" : "cursor-grab"}`}
                />

                {!isDraggingImage && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none opacity-0 group-hover/viewport:opacity-100 transition-opacity" />
                )}

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-[33.33%] top-0 bottom-0 w-px bg-white/10" />
                  <div className="absolute left-[66.66%] top-0 bottom-0 w-px bg-white/10" />
                  <div className="absolute top-[33.33%] left-0 right-0 h-px bg-white/10" />
                  <div className="absolute top-[66.66%] left-0 right-0 h-px bg-white/10" />
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-accent/50 rounded-tl" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-accent/50 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-accent/50 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-accent/50 rounded-br" />
                </div>

                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-[11px] text-text-tertiary font-mono pointer-events-none">
                  {Math.round(zoom * 100)}%
                </div>

                {!isDraggingImage && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] text-text-tertiary pointer-events-none opacity-0 group-hover/viewport:opacity-100 transition-opacity whitespace-nowrap">
                    Drag to reposition · Ctrl+Scroll to zoom
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="w-64 shrink-0 space-y-3">
            {/* Aspect Ratio */}
            <div className="bg-surface-hover rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Maximize2 className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                  Ratio
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setSelectedRatio(preset.label)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRatio === preset.label
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <span
                      className={`rounded shrink-0 transition-all ${
                        selectedRatio === preset.label ? "border-accent" : "border-border-hover"
                      }`}
                      style={{
                        width: getRatioDimensions(preset.w, preset.h, 12).w,
                        height: getRatioDimensions(preset.w, preset.h, 12).h,
                        borderWidth: 1.5,
                      }}
                    />
                    {preset.label}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedRatio("custom")}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedRatio === "custom"
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Custom
                </button>
              </div>
              {selectedRatio === "custom" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
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
                    className="w-full px-2.5 py-1.5 bg-white/5 border border-border rounded-lg text-text-primary text-xs text-center focus:outline-none focus:border-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-text-tertiary text-xs">:</span>
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
                    className="w-full px-2.5 py-1.5 bg-white/5 border border-border rounded-lg text-text-primary text-xs text-center focus:outline-none focus:border-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              )}
            </div>

            {/* Zoom */}
            <div className="bg-surface-hover rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Zoom
                  </span>
                </div>
                <button
                  onClick={handleResetFit}
                  className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
                  title="Fit to view"
                >
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleZoomChange(zoom - 0.1)}
                  disabled={zoom <= 0.1}
                  className="p-1.5 rounded-md bg-white/5 border border-border text-text-tertiary hover:text-text-secondary hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 text-center text-sm text-text-secondary font-mono tabular-nums">
                  {Math.round(zoom * 100)}%
                </div>
                <button
                  onClick={() => handleZoomChange(zoom + 0.1)}
                  disabled={zoom >= 5}
                  className="p-1.5 rounded-md bg-white/5 border border-border text-text-tertiary hover:text-text-secondary hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="range"
                min={10}
                max={500}
                value={Math.round(zoom * 100)}
                onChange={(e) => handleZoomChange(parseInt(e.target.value) / 100)}
                className="w-full accent-accent h-1 rounded-full appearance-none bg-white/10 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent
                  [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(124,58,237,0.4)]
                  [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-accent/30"
              />
            </div>

            {/* Quality */}
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
                <span>Smaller</span>
                <span>Better</span>
              </div>
            </div>

            <button
              onClick={handleCrop}
              disabled={isProcessing}
              className={`w-full h-11 rounded-xl font-medium text-sm text-white transition-all flex items-center justify-center gap-2
                ${isProcessing
                  ? "bg-accent/40 cursor-not-allowed"
                  : "bg-accent hover:bg-accent-hover active:scale-[0.98]"
                }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Crop className="w-4 h-4" />
                  Crop & Download
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-text-tertiary leading-relaxed">
              Drag to reposition · Ctrl+Scroll to zoom
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
