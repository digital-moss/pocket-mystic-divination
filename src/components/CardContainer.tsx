import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ParsedCard } from '../types';
import { haptics } from '../services/haptics';
import { RotateCw, Eye, X, Plus, Hash } from 'lucide-react';

interface CardContainerProps {
  card: ParsedCard | null;
  isFlipped: boolean;
  isReversed: boolean;
  isShuffling: boolean;
  onFlip: () => void;
  onInspect: () => void;
  deckName: string;
  onRemoveAssociation?: (word: string) => void;
  onAddAssociation?: (word: string) => void;
  onToggleReversal: () => void;
  isTarotDeck?: boolean;
  activeArcanaOption?: 'both' | 'major' | 'minor';
  onSelectArcanaOption?: (option: 'both' | 'major' | 'minor') => void;
}

export const CardContainer: React.FC<CardContainerProps> = ({
  card,
  isFlipped,
  isReversed,
  isShuffling,
  onFlip,
  onInspect,
  deckName,
  onRemoveAssociation,
  onAddAssociation,
  onToggleReversal,
  isTarotDeck = false,
  activeArcanaOption = 'both',
  onSelectArcanaOption
}) => {
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [quickWordInput, setQuickWordInput] = useState('');

  const handleCardClick = () => {
    if (isShuffling) return;
    onFlip();
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (quickWordInput.trim() && onAddAssociation) {
      haptics.triggerTouch();
      onAddAssociation(quickWordInput.trim());
      setQuickWordInput('');
      setIsAddingWord(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[340px] sm:max-w-[380px] mx-auto select-none">
      {/* Top Deck Info & Hardware-Style Reversal Switch / Swap Symbol */}
      <div className="w-full flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse"></div>
          <span className="text-[10px] font-mono-code tracking-widest text-neutral-400 uppercase truncate max-w-[130px] sm:max-w-[170px]">
            {deckName || 'ORACLE ARCHIVE'}
          </span>
        </div>

        {/* Tactile Switch / Swap Symbol for Turning Reversals ON and OFF */}
        <button
          id="btn-reversal-switch"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleReversal();
          }}
          className={`group flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-mono-code transition-all cursor-pointer select-none ${
            isReversed
              ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'bg-[#151515] hover:bg-[#202020] border-neutral-700/70 text-neutral-400 hover:text-neutral-200'
          }`}
          title={isReversed ? "Turn reversals OFF (Rotate upright)" : "Turn reversals ON (Rotate reversed)"}
        >
          {/* Swap symbol icon that flips when toggled */}
          <RotateCw 
            className={`w-3.5 h-3.5 transition-transform duration-500 ${
              isReversed ? 'rotate-180 text-amber-400' : 'text-neutral-400 group-hover:rotate-45'
            }`} 
          />
          <span className="tracking-wider">
            REVERSAL <span className={isReversed ? 'text-amber-400 font-bold' : 'text-neutral-400'}>{isReversed ? 'ON' : 'OFF'}</span>
          </span>

          {/* Tactile Toggle Switch Slider Indicator */}
          <div 
            className={`w-6 h-3.5 rounded-full p-0.5 transition-colors flex items-center ${
              isReversed ? 'bg-amber-500' : 'bg-neutral-800'
            }`}
          >
            <div 
              className={`w-2.5 h-2.5 rounded-full transition-transform ${
                isReversed ? 'translate-x-2.5 bg-neutral-950 shadow-sm' : 'translate-x-0 bg-neutral-400'
              }`} 
            />
          </div>
        </button>
      </div>

      {/* Built-in Arcana Options Switcher: Major, Minor, Both */}
      {isTarotDeck && onSelectArcanaOption && (
        <div className="w-full flex items-center justify-between px-1 mb-2.5 bg-[#121212] border border-neutral-800/80 rounded-lg p-1">
          <span className="text-[10px] font-mono-code uppercase tracking-wider text-neutral-400 pl-1">
            ARCANA:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-arcana-both"
              onClick={(e) => {
                e.stopPropagation();
                haptics.triggerTouch();
                onSelectArcanaOption('both');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono-code transition-all cursor-pointer ${
                activeArcanaOption === 'both'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
            >
              BOTH (78)
            </button>
            <button
              type="button"
              id="btn-arcana-major"
              onClick={(e) => {
                e.stopPropagation();
                haptics.triggerTouch();
                onSelectArcanaOption('major');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono-code transition-all cursor-pointer ${
                activeArcanaOption === 'major'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
            >
              MAJOR (22)
            </button>
            <button
              type="button"
              id="btn-arcana-minor"
              onClick={(e) => {
                e.stopPropagation();
                haptics.triggerTouch();
                onSelectArcanaOption('minor');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-mono-code transition-all cursor-pointer ${
                activeArcanaOption === 'minor'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
              }`}
            >
              MINOR (56)
            </button>
          </div>
        </div>
      )}

      {/* 3D Perspective Stage */}
      <div 
        className="w-full aspect-[1/1.62] relative perspective-[1200px] cursor-pointer group"
        onClick={handleCardClick}
      >
        <motion.div
          className="w-full h-full relative preserve-3d"
          animate={{
            rotateY: isFlipped ? 180 : 0,
            x: isShuffling ? [0, -12, 14, -8, 10, -4, 0] : 0,
            y: isShuffling ? [0, -6, 6, -4, 4, 0] : 0,
            rotateZ: isShuffling ? [0, -3, 3, -2, 2, 0] : 0,
            scale: isShuffling ? 0.96 : 1
          }}
          transition={{
            rotateY: { duration: 0.65, ease: [0.25, 1, 0.5, 1] },
            x: { duration: 0.45, repeat: isShuffling ? Infinity : 0 },
            y: { duration: 0.45, repeat: isShuffling ? Infinity : 0 },
            rotateZ: { duration: 0.45, repeat: isShuffling ? Infinity : 0 },
            scale: { duration: 0.2 }
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ================= CARD BACK (0 deg) ================= */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden backface-hidden shadow-2xl border-2 border-[#2b2b2b] bg-[#141414] flex flex-col items-center justify-between p-5"
            style={{ backfaceVisibility: 'hidden' }}
          >
            {/* E-Ink Geometric Card Back */}
            <div className="w-full h-full border border-neutral-700/60 rounded-xl relative p-3 flex flex-col items-center justify-between hardware-texture">
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-neutral-500 font-mono text-xs">✦</div>
              <div className="absolute top-2 right-2 text-neutral-500 font-mono text-xs">✦</div>
              <div className="absolute bottom-2 left-2 text-neutral-500 font-mono text-xs">✦</div>
              <div className="absolute bottom-2 right-2 text-neutral-500 font-mono text-xs">✦</div>

              {/* Top Card Back Label */}
              <div className="pt-2 text-center">
                <span className="text-[10px] font-mono-code tracking-[0.25em] text-neutral-400 uppercase">
                  {deckName || 'ORACLE ARCHIVE'}
                </span>
              </div>

              {/* Central Sacred Geometry Mandala */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Concentric rings */}
                <div className="absolute inset-0 rounded-full border border-neutral-700/50"></div>
                <div className="absolute inset-3 rounded-full border border-dashed border-neutral-600/40"></div>
                <div className="absolute inset-6 rounded-full border border-neutral-700/40"></div>
                
                {/* Intersecting Squares / Star */}
                <div className="absolute w-20 h-20 border border-neutral-600/30 rotate-45"></div>
                <div className="absolute w-20 h-20 border border-neutral-600/30"></div>

                {/* Central Eye / Seal */}
                <div className="text-neutral-300 flex flex-col items-center justify-center">
                  <span className="text-2xl font-serif text-neutral-200">✦</span>
                  <span className="text-[8px] font-mono-code tracking-widest text-neutral-500 mt-1">ESP32</span>
                </div>
              </div>

              {/* Bottom Instructions */}
              <div className="pb-2 text-center">
                <p className="text-[11px] font-mono-code text-neutral-400 tracking-wider">
                  {isShuffling ? 'SHUFFLING DECK...' : 'TAP CARD OR SHAKE'}
                </p>
                <p className="text-[9px] font-mono-code text-neutral-600 mt-0.5">
                  TAP TO REVEAL REVERSE
                </p>
              </div>
            </div>
          </div>

          {/* ================= CARD FRONT (180 deg) ================= */}
          <div 
            className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden backface-hidden shadow-2xl border-2 border-[#333333] bg-[#111111]"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {card ? (
              <div className="w-full h-full relative overflow-hidden">
                {/* Smooth 180° rotation with realistic tactile overshoot: rotates smoothly past 180° and snaps into place */}
                <motion.div 
                  className="w-full h-full relative"
                  style={{ transformOrigin: '50% 50%' }}
                  animate={{
                    rotate: isReversed ? 180 : 0
                  }}
                  transition={{
                    duration: 0.72,
                    ease: [0.34, 1.52, 0.64, 1]
                  }}
                >
                  {/* High quality card art image */}
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                    loading="eager"
                  />
                </motion.div>

                {/* Interactive Reversal Swap Symbol Badge on the Card itself */}
                <button
                  type="button"
                  id="btn-card-swap-orientation"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReversal();
                  }}
                  title="Swap orientation (Reversed / Upright)"
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-mono-code tracking-widest uppercase shadow-lg flex items-center gap-1.5 z-20 backdrop-blur-md border transition-all cursor-pointer ${
                    isReversed
                      ? 'bg-neutral-950/90 border-amber-500/70 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                      : 'bg-neutral-950/80 border-neutral-700/70 text-neutral-300 hover:text-white hover:border-neutral-500'
                  }`}
                >
                  <RotateCw className={`w-3 h-3 transition-transform duration-500 ${isReversed ? 'rotate-180 text-amber-400' : ''}`} />
                  <span>{isReversed ? 'REVERSED' : 'UPRIGHT'}</span>
                </button>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6 text-center text-neutral-500 font-mono-code text-xs">
                NO CARD LOADED
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Card Info & Action Prompts */}
      <div className="mt-4 w-full flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {isFlipped && card ? (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full flex flex-col items-center"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-oracle font-bold text-neutral-100 tracking-wide">
                  {card.name}
                </h2>
                <button
                  type="button"
                  id="btn-reversal-status-badge"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReversal();
                  }}
                  title="Click to toggle reversal"
                  className={`text-[10px] font-mono-code px-2 py-0.5 rounded border transition-colors flex items-center gap-1 cursor-pointer ${
                    isReversed
                      ? 'bg-amber-950/50 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <RotateCw className={`w-2.5 h-2.5 transition-transform duration-500 ${isReversed ? 'rotate-180 text-amber-400' : ''}`} />
                  <span>{isReversed ? 'REVERSED' : 'UPRIGHT'}</span>
                </button>
                {card.arcana && (
                  <span className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                    card.arcana === 'major'
                      ? 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                      : 'bg-sky-950/40 text-sky-300 border-sky-800/40'
                  }`}>
                    {card.arcana === 'major' ? 'Major' : `Minor • ${card.suit || ''}`}
                  </span>
                )}
              </div>

              {/* Word Associations Chips */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 max-w-[340px] px-2">
                {card.keywords.map((kw, i) => (
                  <span
                    key={kw + i}
                    className="group inline-flex items-center gap-1 text-[10px] font-mono-code text-neutral-300 bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 hover:border-neutral-600 px-2 py-0.5 rounded transition-colors"
                  >
                    <span>{kw}</span>
                    {onRemoveAssociation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.triggerTouch();
                          onRemoveAssociation(kw);
                        }}
                        title={`Remove "${kw}"`}
                        className="text-neutral-500 hover:text-red-400 p-0.5 -mr-1"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </span>
                ))}

                {/* Quick Add Pill */}
                {onAddAssociation && (
                  !isAddingWord ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.triggerTouch();
                        setIsAddingWord(true);
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-mono-code text-amber-400/90 hover:text-amber-300 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded transition-colors"
                      title="Add a custom word association"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Word</span>
                    </button>
                  ) : (
                    <form 
                      onSubmit={handleQuickAdd}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={quickWordInput}
                        onChange={(e) => setQuickWordInput(e.target.value)}
                        onBlur={() => {
                          if (!quickWordInput.trim()) setIsAddingWord(false);
                        }}
                        placeholder="New word..."
                        className="w-24 bg-[#141414] border border-amber-500/80 rounded px-1.5 py-0.5 text-[10px] font-mono-code text-neutral-200 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!quickWordInput.trim()}
                        className="px-1.5 py-0.5 bg-amber-500 text-neutral-950 text-[10px] font-mono-code font-bold rounded"
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingWord(false);
                          setQuickWordInput('');
                        }}
                        className="text-neutral-500 hover:text-neutral-300 px-1 text-[10px]"
                      >
                        ✕
                      </button>
                    </form>
                  )
                )}
              </div>

              {/* Meaning preview */}
              <p className="text-xs text-neutral-300 font-sans mt-2 line-clamp-2 px-3 leading-relaxed max-w-[340px]">
                {isReversed && card.meaningReversed
                  ? card.meaningReversed
                  : card.meaningUpright}
              </p>

              {/* Inspect Details / Journal Button */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  id="btn-inspect-card"
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.triggerTouch();
                    onInspect();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600/60 rounded text-xs font-mono-code transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>READING & JOURNAL NOTE</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-2"
            >
              <span className="text-xs font-mono-code text-neutral-400 tracking-widest uppercase">
                {isShuffling ? '✦ Shuffling Arcana...' : '✦ Shake or Tap to Draw ✦'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
