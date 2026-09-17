import React from 'react';
import { Cpu, RotateCcw, Activity, BookOpen, Layers } from 'lucide-react';
import { haptics } from '../services/haptics';

interface HardwareChassisProps {
  children: React.ReactNode;
  onPhysicalShuffle: () => void;
  onPhysicalFlip: () => void;
  onOpenJournal: () => void;
  onOpenDecks: () => void;
  isShuffling: boolean;
  isFlipped: boolean;
}

export const HardwareChassis: React.FC<HardwareChassisProps> = ({
  children,
  onPhysicalShuffle,
  onPhysicalFlip,
  onOpenJournal,
  onOpenDecks,
  isShuffling,
  isFlipped
}) => {
  return (
    <div className="w-full max-w-md mx-auto my-4 p-4 sm:p-6 bg-[#161616] border-4 border-[#242424] rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative select-none">
      {/* 4 Corner Hardware Screws */}
      <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-[#202020] border border-[#333333] flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-neutral-600 rotate-45"></div>
      </div>
      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#202020] border border-[#333333] flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-neutral-600 -rotate-45"></div>
      </div>
      <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-[#202020] border border-[#333333] flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-neutral-600 -rotate-12"></div>
      </div>
      <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[#202020] border border-[#333333] flex items-center justify-center">
        <div className="w-1.5 h-[1px] bg-neutral-600 rotate-45"></div>
      </div>

      {/* Top Device Badge */}
      <div className="flex items-center justify-between pb-3 px-2 text-[10px] font-mono-code text-neutral-500">
        <div className="flex items-center gap-1.5 text-neutral-300">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold tracking-widest">POCKET MYSTIC / ESP32 E-INK</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>ONLINE (OFFLINE CACHE)</span>
        </div>
      </div>

      {/* E-Paper Bezel & Display Screen */}
      <div className="bg-[#121212] border-2 border-[#222222] rounded-2xl overflow-hidden p-2 sm:p-3 shadow-inner">
        {children}
      </div>

      {/* Tactile Bottom Hardware Push Buttons */}
      <div className="mt-4 pt-2 border-t border-[#222222] grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            haptics.triggerTouch();
            onPhysicalShuffle();
          }}
          disabled={isShuffling}
          className="bg-[#202020] hover:bg-[#282828] active:bg-[#181818] active:translate-y-0.5 border border-[#383838] py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center shadow-md group"
        >
          <Activity className={`w-3.5 h-3.5 text-amber-400 mb-0.5 ${isShuffling ? 'animate-spin' : ''}`} />
          <span className="text-[9px] font-mono-code font-bold text-neutral-200">SHUFFLE</span>
        </button>

        <button
          onClick={() => {
            haptics.triggerTouch();
            onPhysicalFlip();
          }}
          className="bg-[#202020] hover:bg-[#282828] active:bg-[#181818] active:translate-y-0.5 border border-[#383838] py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center shadow-md group"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-300 mb-0.5" />
          <span className="text-[9px] font-mono-code font-bold text-neutral-200">
            {isFlipped ? 'HIDE' : 'FLIP'}
          </span>
        </button>

        <button
          onClick={() => {
            haptics.triggerTouch();
            onOpenJournal();
          }}
          className="bg-[#202020] hover:bg-[#282828] active:bg-[#181818] active:translate-y-0.5 border border-[#383838] py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center shadow-md"
        >
          <BookOpen className="w-3.5 h-3.5 text-neutral-400 mb-0.5" />
          <span className="text-[9px] font-mono-code font-bold text-neutral-300">LOG</span>
        </button>

        <button
          onClick={() => {
            haptics.triggerTouch();
            onOpenDecks();
          }}
          className="bg-[#202020] hover:bg-[#282828] active:bg-[#181818] active:translate-y-0.5 border border-[#383838] py-2 px-1 rounded-lg text-center transition-all flex flex-col items-center justify-center shadow-md"
        >
          <Layers className="w-3.5 h-3.5 text-neutral-400 mb-0.5" />
          <span className="text-[9px] font-mono-code font-bold text-neutral-300">DECKS</span>
        </button>
      </div>
    </div>
  );
};
