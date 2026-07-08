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
  RotateCcw,
  ImagePlus,
} from "lucide-react";
import { showToast } from "@/components/Toast";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const [selectedRatio, setSelectedRatio] =
    useState<AspectRatioPreset>("16:9");
  const [customRatio, setCustomRatio] = useState({ w: 5, h: 4 });
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [quality, setQuality] = useState(85);
  const [isProcessing, setIsProcessing] = useState(false);

  const cropContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const changeFileInputRef = useRef<HTMLInputElement>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const preventNativeZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    // Must be non-passive to allow preventDefault()
    el.addEventListener("wheel", preventNativeZoom, { passive: false });
    return () => el.removeEventListener("wheel", preventNativeZoom);
  }, []);

  useEffect(() => {
    if (imageUrl && editorWrapperRef.current) {
      setTimeout(() => {
        editorWrapperRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    }
  }, [imageUrl]);

  const currentRatio =
    selectedRatio === "custom"
      ? customRatio
      : PRESETS.find((p) => p.label === selectedRatio)!;

  const loadImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageFile(file);

    const img = new window.Image();
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
    (x: number, y: number, currentZoom: number = zoom) => {
      if (!cropContainerRef.current) return { x, y };
      const containerW = cropContainerRef.current.clientWidth;
      const containerH = containerW * (currentRatio.h / currentRatio.w);
      const imgW = imageNaturalSize.w * currentZoom;
      const imgH = imageNaturalSize.h * currentZoom;

      let minX, maxX;
      if (imgW < containerW) {
        minX = (containerW - imgW) / 2;
        maxX = minX;
      } else {
        minX = containerW - imgW;
        maxX = 0;
      }

      let minY, maxY;
      if (imgH < containerH) {
        minY = (containerH - imgH) / 2;
        maxY = minY;
      } else {
        minY = containerH - imgH;
        maxY = 0;
      }

      const clampedX = Math.max(minX, Math.min(maxX, x));
      const clampedY = Math.max(minY, Math.min(maxY, y));

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageUrl) return;
    e.preventDefault();
    e.currentTarget.focus();
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
    const newZoom = Math.max(0, Math.min(5, Math.round((zoom + delta) * 100) / 100));

    const rect = cropContainerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomRatio = newZoom / (zoom || 0.001);
    const newX = mouseX - zoomRatio * (mouseX - offsetX);
    const newY = mouseY - zoomRatio * (mouseY - offsetY);

    const clamped = clampOffset(newX, newY, newZoom);
    setZoom(newZoom);
    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(0, Math.min(5, newZoom));
    const zoomRatio = clampedZoom / (zoom || 0.001);
    const containerW = cropContainerRef.current?.clientWidth || 0;
    const containerH = containerW * (currentRatio.h / currentRatio.w);
    const newX = zoomRatio * offsetX + (containerW * (1 - zoomRatio)) / 2;
    const newY = zoomRatio * offsetY + (containerH * (1 - zoomRatio)) / 2;
    const clamped = clampOffset(newX, newY, clampedZoom);
    setZoom(clampedZoom);
    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  const handleResetFit = () => {
    fitImageToContainer();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!imageUrl) return;
    const step = e.shiftKey ? 20 : 5;
    let newX = offsetX;
    let newY = offsetY;

    switch (e.key) {
      case "ArrowUp":
        newY -= step;
        e.preventDefault();
        break;
      case "ArrowDown":
        newY += step;
        e.preventDefault();
        break;
      case "ArrowLeft":
        newX -= step;
        e.preventDefault();
        break;
      case "ArrowRight":
        newX += step;
        e.preventDefault();
        break;
      default:
        return;
    }
    const clamped = clampOffset(newX, newY);
    setOffsetX(clamped.x);
    setOffsetY(clamped.y);
  };

  const handleCrop = async () => {
    if (!imageFile || !cropContainerRef.current || !imageUrl) return;
    setIsProcessing(true);

    const containerW = cropContainerRef.current.clientWidth;
    const containerH = containerW * (currentRatio.h / currentRatio.w);

    const crop = {
      left: Math.round(Math.max(0, -offsetX / (zoom || 0.001))),
      top: Math.round(Math.max(0, -offsetY / (zoom || 0.001))),
      width: Math.round(Math.min(imageNaturalSize.w, containerW / (zoom || 0.001))),
      height: Math.round(Math.min(imageNaturalSize.h, containerH / (zoom || 0.001))),
    };

    try {
      // Create a canvas to crop the image client-side to save upload bandwidth and avoid Vercel 4.5MB limit
      const img = new window.Image();
      img.src = imageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const formData = new FormData();
      // Send the original, pristine image file along with the crop coordinates.
      // The server will handle the precise cropping and high-quality AVIF conversion.
      formData.append("image", imageFile);
      formData.append("left", crop.left.toString());
      formData.append("top", crop.top.toString());
      formData.append("width", crop.width.toString());
      formData.append("height", crop.height.toString());
      formData.append("quality", quality.toString());

      const response = await fetch("/api/crop", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to crop image");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileNameWithoutExt =
        imageFile.name.substring(0, imageFile.name.lastIndexOf(".")) ||
        imageFile.name;
      a.download = `${fileNameWithoutExt}_cropped.avif`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();

      showToast(
        `Cropped! ${formatFileSize(imageFile.size)} ➔ ${formatFileSize(blob.size)}`,
        "success"
      );
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Something went wrong while processing the image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const qualityProgress = `${quality}%`;

  return (
    <div>
      {!imageUrl ? (
        /* ─── Dropzone ─── */
        <div
          className={`relative rounded-xl p-14 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group border-2 border-dashed ${isDragging
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
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <div
            className={`mb-5 p-4 rounded-2xl transition-all duration-500 ${isDragging
                ? "bg-accent/20 scale-110 animate-pulse-glow"
                : "bg-white/[0.04] group-hover:bg-accent/10 group-hover:scale-105"
              }`}
          >
            <UploadCloud
              className={`w-12 h-12 transition-all duration-300 ${isDragging
                  ? "text-accent"
                  : "text-text-tertiary group-hover:text-accent"
                }`}
            />
          </div>
          <p className="text-text-primary font-semibold text-lg mb-1.5">
            Drop an image here
          </p>
          <p className="text-text-tertiary text-sm mb-5">or click to browse</p>
          <span className="inline-flex items-center gap-2 text-xs text-text-tertiary bg-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.06]">
            JPG · PNG · WEBP · TIFF
          </span>
        </div>
      ) : (
        /* ─── Crop Editor ─── */
        <div ref={editorWrapperRef} className="flex flex-col lg:flex-row gap-5 animate-fade-in-up">
          {/* Crop Viewport and CTA */}
          <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Outer Wrapper Canvas */}
            <div
              ref={viewportRef}
              className="relative w-full bg-[#0a0a0c] rounded-2xl overflow-hidden p-4 sm:p-12 lg:p-20 flex flex-col items-center justify-center group/viewport border border-white/[0.04] shadow-inner focus:outline-none focus:ring-2 focus:ring-accent/50"
              tabIndex={0}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onKeyDown={handleKeyDown}
            >
              <div
                ref={cropContainerRef}
                style={{
                  aspectRatio: `${currentRatio.w} / ${currentRatio.h}`,
                }}
                className={`w-full relative transition-all select-none ${isDraggingImage ? "ring-accent/70 ring-2" : "ring-white/[0.15] ring-1"
                  }`}
              >
                {/* Image */}
                <img
                  src={imageUrl}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    transform: `translate(${offsetX}px, ${offsetY}px) scale(${zoom})`,
                    transformOrigin: "0 0",
                  }}
                  className={`absolute top-0 left-0 max-w-none transition-transform duration-75 ${isDraggingImage ? "cursor-grabbing" : "cursor-grab"
                    }`}
                />

                {/* Dark Mask for cut-off parts using box-shadow */}
                <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none z-10" />

                {/* Vignette overlay on hover */}
                {!isDraggingImage && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none opacity-0 group-hover/viewport:opacity-100 transition-opacity duration-300 z-10" />
                )}

                {/* Rule of thirds grid (clipped to crop box) */}
                <div className="absolute inset-0 pointer-events-none opacity-40 group-hover/viewport:opacity-60 transition-opacity overflow-hidden z-10">
                  <div className="absolute left-[33.33%] top-0 bottom-0 w-px bg-white/15" />
                  <div className="absolute left-[66.66%] top-0 bottom-0 w-px bg-white/15" />
                  <div className="absolute top-[33.33%] left-0 right-0 h-px bg-white/15" />
                  <div className="absolute top-[66.66%] left-0 right-0 h-px bg-white/15" />
                </div>

                {/* Corner brackets */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent/40 rounded-tl transition-all duration-300 group-hover/viewport:border-accent/80 group-hover/viewport:w-8 group-hover/viewport:h-8" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-accent/40 rounded-tr transition-all duration-300 group-hover/viewport:border-accent/80 group-hover/viewport:w-8 group-hover/viewport:h-8" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-accent/40 rounded-bl transition-all duration-300 group-hover/viewport:border-accent/80 group-hover/viewport:w-8 group-hover/viewport:h-8" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent/40 rounded-br transition-all duration-300 group-hover/viewport:border-accent/80 group-hover/viewport:w-8 group-hover/viewport:h-8" />
                </div>
              </div>

              {/* Zoom badge (moved to wrapper so it's always in corner) */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] text-text-tertiary font-mono pointer-events-none border border-white/[0.06] z-20">
                {(zoom * 100).toFixed(2)}%
              </div>

              {/* Help hint (moved to wrapper) */}
              {!isDraggingImage && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] text-text-tertiary pointer-events-none opacity-0 group-hover/viewport:opacity-100 transition-opacity duration-300 whitespace-nowrap border border-white/[0.06] z-20">
                  Drag to reposition · Ctrl+Scroll to zoom
                </div>
              )}
            </div>

            {/* ─── CTA below image ─── */}
            <div className="w-full flex flex-col items-center mt-2">
              <button
                onClick={handleCrop}
                disabled={isProcessing}
                className={`group/btn relative w-full max-w-md h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2.5 overflow-hidden transition-all duration-300 ${isProcessing
                    ? "bg-accent/40 cursor-not-allowed"
                    : "bg-gradient-to-r from-violet-600 via-accent to-purple-700 hover:shadow-[0_0_24px_rgba(124,58,237,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
                  }`}
              >
                {/* Shimmer overlay */}
                {!isProcessing && (
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-in-out" />
                )}
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
              <p className="text-center text-[11px] text-text-tertiary leading-relaxed mt-2">
                Drag to reposition · Ctrl+Scroll to zoom
              </p>
            </div>
          </div>

          {/* ─── Controls Sidebar ─── */}
          <div className="w-full lg:w-56 shrink-0 space-y-3">
            {/* Change Image */}
            <button
              onClick={() => changeFileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-text-tertiary bg-white/[0.03] border border-white/[0.06] hover:border-accent/20 hover:text-text-secondary transition-all duration-200"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Change Image
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={changeFileInputRef}
              onChange={handleFileChange}
            />

            {/* Aspect Ratio */}
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
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
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedRatio === preset.label
                        ? "bg-accent/15 text-accent border border-accent/30 scale-[1.02]"
                        : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] border border-transparent"
                      }`}
                  >
                    <span
                      className={`rounded shrink-0 transition-all duration-200 ${selectedRatio === preset.label
                          ? "border-accent"
                          : "border-white/[0.15]"
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
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedRatio === "custom"
                      ? "bg-accent/15 text-accent border border-accent/30 scale-[1.02]"
                      : "text-text-tertiary hover:text-text-secondary hover:bg-white/[0.04] border border-transparent"
                    }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Custom
                </button>
              </div>
              {selectedRatio === "custom" && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
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
                    className="w-full px-2.5 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-text-primary text-xs text-center focus:outline-none focus:border-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-text-tertiary text-xs font-medium">
                    :
                  </span>
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
                    className="w-full px-2.5 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded-lg text-text-primary text-xs text-center focus:outline-none focus:border-accent/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              )}
            </div>

            {/* Zoom */}
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                    Zoom
                  </span>
                </div>
                <button
                  onClick={handleResetFit}
                  className="flex items-center gap-1 text-[11px] text-text-tertiary hover:text-accent transition-colors"
                  title="Fit to view"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => handleZoomChange(Math.round((zoom - 0.0005) * 10000) / 10000)}
                  disabled={zoom <= 0}
                  className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-text-tertiary hover:text-text-secondary hover:bg-white/[0.08] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 text-center text-sm text-text-secondary font-mono tabular-nums">
                  {(zoom * 100).toFixed(2)}%
                </div>
                <button
                  onClick={() => handleZoomChange(Math.round((zoom + 0.0005) * 10000) / 10000)}
                  disabled={zoom >= 5}
                  className="p-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-text-tertiary hover:text-text-secondary hover:bg-white/[0.08] disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="range"
                min={0}
                max={500}
                step={0.01}
                value={(zoom * 100).toFixed(2)}
                onChange={(e) =>
                  handleZoomChange(parseFloat(e.target.value) / 100)
                }
                className="styled-range w-full"
                style={
                  {
                    "--range-progress": `${(((zoom * 100) - 0) / (500 - 0)) * 100}%`,
                  } as React.CSSProperties
                }
              />
            </div>

            {/* Quality */}
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
                  {
                    "--range-progress": qualityProgress,
                  } as React.CSSProperties
                }
              />
              <div className="flex justify-between text-[11px] text-text-tertiary mt-2">
                <span>Smaller</span>
                <span>Better</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
