import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  FolderTree, 
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { ANDROID_KOTLIN_FILES } from '../data/androidKotlinCode';
import { KotlinFile } from '../types';
import { haptics } from '../services/haptics';
import JSZip from 'jszip';

export const AndroidCodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<KotlinFile>(ANDROID_KOTLIN_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);

  const handleCopy = () => {
    haptics.triggerTouch();
    navigator.clipboard.writeText(selectedFile.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadSingle = () => {
    haptics.triggerTouch();
    const blob = new Blob([selectedFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAllZip = async () => {
    haptics.triggerTouch();
    setIsExportingAll(true);
    try {
      const zip = new JSZip();
      
      // Organize into standard Android project directory structure
      ANDROID_KOTLIN_FILES.forEach((f) => {
        if (f.fileName === 'build.gradle.kts') {
          zip.file('app/build.gradle.kts', f.code);
        } else {
          const pathSegments = f.packagePath.replace(/\./g, '/');
          zip.file(`app/src/main/java/${pathSegments}/${f.fileName}`, f.code);
        }
      });

      // Also include a README
      const readme = `# Pocket Mystic — Android Studio Project Source
- Customizable Divination Tool - Tarot, Runes, I-Ching
Exported from Google AI Studio.

## Architecture
- Kotlin + Jetpack Compose + Material 3
- Room Database for offline draw journal logging
- Coil (io.coil-kt:coil-compose) for image rendering
- Android SensorManager (Sensor.TYPE_ACCELEROMETER) for shake-to-draw
- Android Vibrator / VibrationEffect API for tactile haptic feedback
- Storage Access Framework for importing custom .zip deck archives

## Setup
1. Open in Android Studio Hedgehog or newer.
2. Sync Gradle files.
3. Run on physical device to test accelerometer shake & tactile vibration.
`;
      zip.file('README.md', readme);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pocket_mystic_android_sources.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Android zip:', err);
    } finally {
      setIsExportingAll(false);
    }
  };

  const lineCount = selectedFile.code.split('\n').length;

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-oracle font-bold text-neutral-100">
              PRODUCTION ANDROID KOTLIN CODEBASE
            </h2>
          </div>
          <p className="text-xs font-mono-code text-neutral-400 mt-1">
            Jetpack Compose • Room Database • Coil • Sensors • SAF Zip Parser • Zero Placeholders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-android-zip"
            onClick={handleExportAllZip}
            disabled={isExportingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-mono-code font-bold transition-colors shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingAll ? 'PACKING ZIP...' : 'DOWNLOAD ANDROID ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Main Code Explorer Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#141414] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Sidebar: File Tree */}
        <div className="p-3 border-b md:border-b-0 md:border-r border-neutral-800 bg-[#121212] space-y-3">
          <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-mono-code text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800/80 pb-2">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <span>Project Files ({ANDROID_KOTLIN_FILES.length})</span>
          </div>

          <div className="space-y-1">
            {ANDROID_KOTLIN_FILES.map((file) => {
              const isSelected = file.fileName === selectedFile.fileName;
              return (
                <button
                  key={file.fileName}
                  onClick={() => {
                    haptics.triggerTouch();
                    setSelectedFile(file);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono-code flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-950/50 border border-indigo-500/50 text-indigo-200 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-indigo-400' : 'text-neutral-500'}`} />
                    <span className="truncate">{file.fileName}</span>
                  </div>
                  <span className="text-[9px] text-neutral-500 uppercase">
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Guide */}
          <div className="pt-3 border-t border-neutral-800/80 px-2 text-[10px] font-mono-code text-neutral-500 space-y-1">
            <div className="text-neutral-400 font-bold">Recommended Workflow:</div>
            <p>1. Copy files to your Android Studio app package.</p>
            <p>2. Physical device recommended for accelerometer & haptics.</p>
          </div>
        </div>

        {/* Right Editor Area: Active Code */}
        <div className="md:col-span-3 flex flex-col bg-[#111111]">
          {/* File Tab Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-neutral-800 bg-[#161616]">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-code text-sm font-bold text-neutral-100">
                  {selectedFile.fileName}
                </span>
                <span className="text-[10px] font-mono-code text-neutral-500">
                  {selectedFile.packagePath}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-sans mt-0.5">
                {selectedFile.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-code text-neutral-500 hidden sm:inline">
                {lineCount} lines
              </span>
              <button
                onClick={handleDownloadSingle}
                className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono-code flex items-center gap-1 transition-colors"
                title="Download this file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-mono-code flex items-center gap-1.5 transition-colors border border-neutral-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
              </button>
            </div>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="p-4 overflow-x-auto max-h-[68vh] text-xs font-mono-code leading-relaxed text-neutral-300">
            <pre className="select-text">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
