import React from 'react';
import { 
  Sparkles, 
  Layers, 
  BookOpen, 
  Code2, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  Smartphone,
  Cpu
} from 'lucide-react';
import { haptics } from '../services/haptics';

export type ActiveTab = 'draw' | 'decks' | 'journal' | 'kotlin';

interface HeaderBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isHardwareFrame: boolean;
  onToggleHardwareFrame: () => void;
  activeDeckName: string;
  totalCards: number;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onTabChange,
  isHardwareFrame,
  onToggleHardwareFrame,
  activeDeckName,
  totalCards
}) => {
  const [soundOn, setSoundOn] = React.useState(haptics.isSoundEnabled());
  const [hapticMode, setHapticMode] = React.useState(haptics.getMode());

  const handleToggleSound = () => {
    const newState = haptics.toggleSound();
    setSoundOn(newState);
    if (newState) haptics.triggerCardReveal();
  };

  const handleToggleHaptics = () => {
    const nextMode = hapticMode === 'click' ? 'heavy' : hapticMode === 'heavy' ? 'off' : 'click';
    haptics.setMode(nextMode);
    setHapticMode(nextMode);
    haptics.triggerTouch();
  };

  const handleTabClick = (tab: ActiveTab) => {
    haptics.triggerTouch();
    onTabChange(tab);
  };

  return (
    <header className="w-full bg-[#121212] border-b border-[#242424] px-3 sm:px-6 py-2.5 select-none">
      {/* Top Hardware Telemetry Bar */}
      <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] font-mono-code text-neutral-400 pb-2 border-b border-[#1c1c1c]">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1.5 text-neutral-200 font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            POCKET MYSTIC
          </span>
          <span className="hidden xl:inline text-[10px] text-neutral-400 font-mono-code font-normal">
            - Customizable Divination Tool - Tarot, Runes, I-Ching
          </span>
          <span className="hidden sm:inline text-neutral-600">|</span>
          <span className="hidden sm:inline text-neutral-400">
            DECK: <span className="text-neutral-200">{activeDeckName}</span> ({totalCards})
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Audio toggle */}
          <button
            id="btn-toggle-sound"
            onClick={handleToggleSound}
            title={soundOn ? 'Audio feedback active (Click to mute)' : 'Audio feedback muted (Click to enable)'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              soundOn ? 'border-neutral-700 text-neutral-200 bg-neutral-800/60' : 'border-neutral-800 text-neutral-500'
            }`}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{soundOn ? 'AUDIO' : 'MUTE'}</span>
          </button>

          {/* Haptics toggle */}
          <button
            id="btn-toggle-haptics"
            onClick={handleToggleHaptics}
            title={`Haptics: ${hapticMode}`}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              hapticMode !== 'off' ? 'border-neutral-700 text-neutral-200 bg-neutral-800/60' : 'border-neutral-800 text-neutral-500'
            }`}
          >
            <Vibrate className={`w-3.5 h-3.5 ${hapticMode !== 'off' ? 'text-emerald-400' : ''}`} />
            <span className="hidden md:inline">{hapticMode.toUpperCase()}</span>
          </button>

          {/* Hardware Frame Skin Toggle */}
          <button
            id="btn-toggle-hardware-frame"
            onClick={() => {
              haptics.triggerTouch();
              onToggleHardwareFrame();
            }}
            title={isHardwareFrame ? 'Switch to fullscreen view' : 'Switch to ESP32 handheld shell'}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              isHardwareFrame ? 'border-amber-700/50 bg-amber-950/20 text-amber-300' : 'border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {isHardwareFrame ? <Cpu className="w-3.5 h-3.5 text-amber-400" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{isHardwareFrame ? 'ESP32 CASE' : 'MODERN VIEW'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="max-w-6xl mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            id="tab-draw"
            onClick={() => handleTabClick('draw')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono-code transition-all ${
              activeTab === 'draw'
                ? 'bg-neutral-200 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>DAILY DRAW</span>
          </button>

          <button
            id="tab-decks"
            onClick={() => handleTabClick('decks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono-code transition-all ${
              activeTab === 'decks'
                ? 'bg-neutral-200 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>DECKS & ZIP</span>
          </button>

          <button
            id="tab-journal"
            onClick={() => handleTabClick('journal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono-code transition-all ${
              activeTab === 'journal'
                ? 'bg-neutral-200 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>JOURNAL</span>
          </button>

          <button
            id="tab-kotlin"
            onClick={() => handleTabClick('kotlin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono-code transition-all ${
              activeTab === 'kotlin'
                ? 'bg-neutral-200 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">KOTLIN CODE</span>
            <span className="sm:hidden">KOTLIN</span>
          </button>
        </div>

        {/* Brand Monogram */}
        <div className="hidden sm:flex items-center gap-2 text-right">
          <span className="text-[10px] font-mono-code text-neutral-400 uppercase tracking-widest">
            POCKET MYSTIC
          </span>
        </div>
      </div>
    </header>
  );
};
