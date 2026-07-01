"use client";

import { useState } from "react";
import { Image, FileArchive, Crop } from "lucide-react";
import CompressTool from "@/components/CompressTool";
import CropTool from "@/components/CropTool";
import ToastContainer from "@/components/Toast";

type Tab = "compress" | "crop";

const TABS: { id: Tab; label: string }[] = [
  { id: "compress", label: "Compress" },
  { id: "crop", label: "Crop & Convert" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("compress");

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-accent/25">
      <nav className="w-full flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 rounded-lg">
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
            className="p-2 rounded-lg hover:bg-surface-hover hover:text-text-secondary transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-surface-hover hover:text-text-secondary transition-colors"
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
            className="p-2 rounded-lg hover:bg-surface-hover hover:text-text-secondary transition-colors"
            aria-label="LinkedIn"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div
          className={`w-full bg-surface border border-border rounded-2xl p-8 ${
            activeTab === "crop" ? "max-w-5xl" : "max-w-2xl"
          }`}
        >
          <div
            className="flex mb-6 bg-[#121215] rounded-xl p-1"
            role="tablist"
            aria-label="Tool mode"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {tab.id === "compress" ? (
                  <FileArchive className="w-4 h-4" />
                ) : (
                  <Crop className="w-4 h-4" />
                )}
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "compress" ? <CompressTool /> : <CropTool />}
        </div>
      </main>

      <footer className="w-full flex items-center justify-between px-6 py-4 text-text-tertiary text-xs border-t border-border">
        <span>&copy; {new Date().getFullYear()} Image Compressor</span>
        <span>All processing is done locally — files are never uploaded</span>
      </footer>

      <ToastContainer />
    </div>
  );
}
