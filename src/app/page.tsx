"use client";

import { useState, useEffect } from "react";
import {
  Image,
  FileArchive,
  Crop,
  Shield,
  Zap,
  HardDrive,
  Sparkles,
} from "lucide-react";
import CompressTool from "@/components/CompressTool";
import CropTool from "@/components/CropTool";
import ToastContainer from "@/components/Toast";

type Tab = "compress" | "crop";

const TABS: { id: Tab; label: string; icon: typeof FileArchive }[] = [
  { id: "compress", label: "Compress", icon: FileArchive },
  { id: "crop", label: "Crop & Convert", icon: Crop },
];

const FEATURES = [
  {
    icon: Shield,
    label: "100% Private",
    desc: "Files never leave your device",
  },
  { icon: Zap, label: "Lightning Fast", desc: "Server-side Sharp processing" },
  {
    icon: HardDrive,
    label: "Batch Support",
    desc: "Process multiple files at once",
  },
  {
    icon: Sparkles,
    label: "AVIF Output",
    desc: "Next-gen image format",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("compress");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] bg-mesh text-white flex flex-col font-sans selection:bg-accent/25">
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 glass-nav w-full flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-accent to-purple-800 p-2 rounded-xl shadow-lg shadow-accent/20">
            <Image className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Image Compressor
          </span>
        </div>
        <div className="flex items-center gap-1 text-text-tertiary">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-white/[0.06] hover:text-text-secondary transition-all duration-200"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-white/[0.06] hover:text-text-secondary transition-all duration-200"
            aria-label="Twitter"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-white/[0.06] hover:text-text-secondary transition-all duration-200"
            aria-label="LinkedIn"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col items-center p-6 relative z-10">
        {/* ─── Hero Section ─── */}
        <div className="w-full max-w-2xl text-center mt-8 mb-10">
          <div
            className={`transition-all duration-700 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium mb-6">
              <Shield className="w-3 h-3" />
              Privacy-first · No uploads stored
            </div>
          </div>

          <h1
            className={`text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-4 transition-all duration-700 delay-100 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            <span className="gradient-text">Compress, Crop &</span>
            <br />
            <span className="gradient-text-accent">Convert to AVIF</span>
          </h1>

          <p
            className={`text-text-secondary text-base sm:text-lg max-w-md mx-auto leading-relaxed transition-all duration-700 delay-200 ${
              mounted
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            Enterprise-grade image processing, directly in your browser.
            Lightning fast, completely private.
          </p>
        </div>

        {/* ─── Main Tool Card ─── */}
        <div
          className={`w-full glass-panel rounded-2xl p-6 sm:p-8 glow-accent transition-all duration-700 delay-300 ${
            activeTab === "crop" ? "max-w-7xl" : "max-w-2xl"
          } ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Tab Switcher */}
          <div
            className="relative flex mb-6 bg-black/40 rounded-xl p-1"
            role="tablist"
            aria-label="Tool mode"
          >
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-accent to-purple-800 shadow-lg shadow-accent/25 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: `calc(${100 / TABS.length}% - 4px)`,
                left:
                  activeTab === "compress"
                    ? "4px"
                    : `calc(${100 / TABS.length}% + 0px)`,
              }}
            />
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "compress" ? <CompressTool /> : <CropTool />}
        </div>

        {/* ─── Feature Badges ─── */}
        <div className="w-full max-w-2xl mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.label}
              className={`group flex flex-col items-center text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-300 cursor-default ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: mounted ? `${400 + i * 80}ms` : "0ms",
              }}
            >
              <div className="p-2 rounded-lg bg-accent/10 mb-2.5 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-xs font-semibold text-text-primary mb-0.5">
                {feature.label}
              </span>
              <span className="text-[11px] text-text-tertiary leading-tight">
                {feature.desc}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative w-full px-6 py-5 text-text-tertiary text-xs">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        <div className="flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Image Compressor</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            All processing done locally
          </span>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}
