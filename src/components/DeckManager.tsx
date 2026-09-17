import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Layers, 
  Download, 
  Check, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  Grid, 
  FileArchive,
  ArrowRight,
  Camera
} from 'lucide-react';
import { Deck, ParsedCard } from '../types';
import { 
  importDeckFromZip, 
  generateAndDownloadSampleDeckZip, 
  deleteCustomDeckFromStorage 
} from '../services/deckImporter';
import { CardDetailsModal } from './CardDetailsModal';
import { PhotoDeckCreator } from './PhotoDeckCreator';
import { haptics } from '../services/haptics';

interface DeckManagerProps {
  decks: Deck[];
  activeDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onDeckImported: (newDeck: Deck) => void;
  onDeckDeleted: (deckId: string) => void;
  onCardAssociationsChanged?: (deckId: string, cardIndex: number, newKeywords: string[]) => void;
}

export const DeckManager: React.FC<DeckManagerProps> = ({
  decks,
  activeDeckId,
  onSelectDeck,
  onDeckImported,
  onDeckDeleted,
  onCardAssociationsChanged
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingZip, setIsProcessingZip] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [inspectingDeck, setInspectingDeck] = useState<Deck | null>(null);
  const [editingCardInDeck, setEditingCardInDeck] = useState<ParsedCard | null>(null);
  const [isCreatingPhotoDeck, setIsCreatingPhotoDeck] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processZipFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setImportError('Please select a valid .zip archive file.');
      return;
    }

    setIsProcessingZip(true);
    setImportError(null);
    setImportSuccessMessage(null);

    try {
      const result = await importDeckFromZip(file);
      haptics.triggerCardReveal();
      onDeckImported(result.deck);
      setImportSuccessMessage(
        `Successfully imported "${result.deck.name}" with ${result.cardCount} cards!`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import ZIP file';
      setImportError(message);
    } finally {
      setIsProcessingZip(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processZipFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processZipFile(e.target.files[0]);
    }
  };

  const handleDownloadSampleZip = async () => {
    haptics.triggerTouch();
    try {
      const blob = await generateAndDownloadSampleDeckZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pocket_mystic_sample_deck.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setImportError('Failed to generate sample zip');
    }
  };

  const handleQuickLoadSampleDeck = async () => {
    setIsProcessingZip(true);
    setImportError(null);
    try {
      const blob = await generateAndDownloadSampleDeckZip();
      const mockFile = new File([blob], 'Pocket Mystic Demo Deck.zip', { type: 'application/zip' });
      const result = await importDeckFromZip(mockFile, 'Mystic Alchemist Sample Deck');
      haptics.triggerCardReveal();
      onDeckImported(result.deck);
      setImportSuccessMessage(`Loaded "${result.deck.name}" with ${result.cardCount} cards!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to import sample deck';
      setImportError(message);
    } finally {
      setIsProcessingZip(false);
    }
  };

  const handleDeleteCustomDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.triggerTouch();
    deleteCustomDeckFromStorage(deckId);
    onDeckDeleted(deckId);
  };

  if (isCreatingPhotoDeck) {
    return (
      <PhotoDeckCreator
        onDeckCreated={(newDeck) => {
          setIsCreatingPhotoDeck(false);
          onDeckImported(newDeck);
        }}
        onCancel={() => setIsCreatingPhotoDeck(false)}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Title & Concept Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-lg font-oracle font-bold text-neutral-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>POCKET MYSTIC DECKS</span>
          </h2>
          <p className="text-xs font-mono-code text-neutral-400 mt-1">
            Customizable Divination Tool - Tarot, Runes, I-Ching • Snap photos of your physical cards or import custom decks from .zip files
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-take-photos-deck"
            onClick={() => {
              haptics.triggerTouch();
              setIsCreatingPhotoDeck(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-bold rounded-lg text-xs font-mono-code transition-colors shadow-md"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Photos of Deck</span>
          </button>

          <button
            id="btn-download-sample-zip"
            onClick={handleDownloadSampleZip}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-xs font-mono-code transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download Sample .ZIP</span>
          </button>
        </div>
      </div>

      {/* Dual Intake Banner: Photo Camera vs ZIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Photo Camera Intake Card */}
        <div
          onClick={() => {
            haptics.triggerTouch();
            setIsCreatingPhotoDeck(true);
          }}
          className="border border-sky-900/60 hover:border-sky-500/80 bg-gradient-to-br from-[#141d24] to-[#121212] p-4 rounded-xl cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-800 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-mono-code font-bold text-sky-200 uppercase tracking-wider">
                Photo Deck Importer (Camera)
              </h3>
              <p className="text-[11px] font-mono-code text-neutral-400 mt-1">
                Point your camera at your real physical cards. The app auto-populates card names, word associations, and meanings.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs font-mono-code text-sky-400 font-bold">
            <span>Open Camera Importer</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Quick Demo Deck Load Card */}
        <div
          onClick={handleQuickLoadSampleDeck}
          className="border border-amber-900/40 hover:border-amber-500/60 bg-gradient-to-br from-[#1e1914] to-[#121212] p-4 rounded-xl cursor-pointer transition-all group flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-lg bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-mono-code font-bold text-amber-200 uppercase tracking-wider">
                Sample Alchemist Deck
              </h3>
              <p className="text-[11px] font-mono-code text-neutral-400 mt-1">
                Instantly load a full 22-card illustrated sample deck with custom imagery and word associations.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1 text-xs font-mono-code text-amber-400 font-bold">
            <span>Load Demo Deck</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ZIP Archive Dropzone (SAF DeckImporter counterpart) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-950/20'
            : 'border-neutral-700 hover:border-neutral-500 bg-[#141414] hover:bg-[#181818]'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".zip,application/zip"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-amber-400">
            {isProcessingZip ? (
              <Sparkles className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-mono-code font-bold text-neutral-200">
              {isProcessingZip ? 'UNZIPPING & PARSING CARD FILENAMES...' : 'CLICK OR DRAG .ZIP DECK HERE'}
            </h3>
            <p className="text-xs font-mono-code text-neutral-500 mt-1 max-w-md mx-auto">
              Extracts image files (.png, .jpg, .webp, .svg) and automatically normalizes card indices (e.g. 00_fool.png, 1-magician.jpg, The Fool.png)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleQuickLoadSampleDeck();
              }}
              className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded text-xs font-mono-code flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Test: Load Sample Custom Deck</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {importError && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs font-mono-code flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{importError}</span>
        </div>
      )}

      {importSuccessMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs font-mono-code flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {/* Decks Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono-code font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
          <span>AVAILABLE DECKS ({decks.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {decks.map((deck) => {
            const isActive = deck.id === activeDeckId;
            return (
              <div
                key={deck.id}
                onClick={() => {
                  haptics.triggerTouch();
                  onSelectDeck(deck.id);
                }}
                className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-[#1a1a1a] border-amber-500/70 shadow-lg ring-1 ring-amber-500/30'
                    : 'bg-[#141414] hover:bg-[#181818] border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: deck.accentColor || '#c5a059' }}
                      />
                      <h4 className="font-mono-code text-sm font-bold text-neutral-100">
                        {deck.name}
                      </h4>
                    </div>

                    {deck.isCustom ? (
                      <span className="text-[9px] font-mono-code bg-amber-950/60 border border-amber-800/60 text-amber-300 px-1.5 py-0.5 rounded uppercase">
                        CUSTOM ZIP
                      </span>
                    ) : deck.id === 'tarot-full-deck' ? (
                      <span className="text-[9px] font-mono-code bg-amber-950/40 border border-amber-600/50 text-amber-300 px-1.5 py-0.5 rounded uppercase font-bold">
                        BOTH ARCANA (78)
                      </span>
                    ) : deck.id === 'tarot-major-arcana' ? (
                      <span className="text-[9px] font-mono-code bg-amber-950/40 border border-amber-700/50 text-amber-300 px-1.5 py-0.5 rounded uppercase">
                        MAJOR ARCANA (22)
                      </span>
                    ) : deck.id === 'tarot-minor-arcana' ? (
                      <span className="text-[9px] font-mono-code bg-sky-950/40 border border-sky-700/50 text-sky-300 px-1.5 py-0.5 rounded uppercase">
                        MINOR ARCANA (56)
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-neutral-400 mt-2 line-clamp-2 leading-relaxed">
                    {deck.description}
                  </p>

                  <div className="text-[11px] font-mono-code text-neutral-500 mt-3 flex items-center gap-3">
                    <span>{deck.cardCount} CARDS</span>
                    {deck.cards[0] && (
                      <span>FIRST: #{deck.cards[0].index} {deck.cards[0].name}</span>
                    )}
                  </div>
                </div>

                {/* Card preview strip */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-neutral-800/60 overflow-hidden">
                  {deck.cards.slice(0, 4).map((c, i) => (
                    <div
                      key={i}
                      className="w-9 h-12 rounded overflow-hidden border border-neutral-700/80 bg-neutral-900 flex-shrink-0"
                    >
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {deck.cards.length > 4 && (
                    <div className="w-9 h-12 rounded border border-neutral-800 bg-neutral-900/60 flex items-center justify-center text-[10px] font-mono-code text-neutral-500 flex-shrink-0">
                      +{deck.cards.length - 4}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between mt-3 pt-2 text-xs font-mono-code">
                  <span className={`flex items-center gap-1 text-[11px] font-semibold ${isActive ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {isActive ? <Check className="w-3.5 h-3.5" /> : null}
                    {isActive ? 'ACTIVE DECK' : 'CLICK TO SELECT'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.triggerTouch();
                        setInspectingDeck(deck);
                      }}
                      className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      title="Inspect cards in deck"
                    >
                      <Grid className="w-3.5 h-3.5" />
                    </button>

                    {deck.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomDeck(deck.id, e)}
                        className="p-1.5 rounded hover:bg-red-950/60 text-neutral-500 hover:text-red-400"
                        title="Delete custom deck"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Grid Inspector Modal */}
      {inspectingDeck && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="w-full max-w-3xl bg-[#141414] border border-neutral-700 rounded-2xl p-5 max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div>
                <h3 className="font-mono-code text-sm font-bold text-neutral-100 flex items-center gap-2">
                  <Grid className="w-4 h-4 text-amber-400" />
                  <span>{inspectingDeck.name} ({inspectingDeck.cardCount} cards)</span>
                </h3>
                <p className="text-[11px] font-mono-code text-neutral-400 mt-0.5">
                  Normalized indices and artwork parsed from archive
                </p>
              </div>
              <button
                onClick={() => setInspectingDeck(null)}
                className="text-neutral-400 hover:text-neutral-200 text-sm font-mono-code p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {inspectingDeck.cards.map((c) => (
                <div
                  key={c.index}
                  onClick={() => {
                    haptics.triggerTouch();
                    setEditingCardInDeck(c);
                  }}
                  className="bg-[#181818] hover:bg-[#202020] border border-neutral-800 hover:border-neutral-600 rounded-xl p-2.5 flex flex-col items-center text-center space-y-1.5 cursor-pointer transition-all group"
                >
                  <div className="w-full aspect-[1/1.5] rounded-lg overflow-hidden border border-neutral-700/60 bg-neutral-900 group-hover:border-amber-500/50 transition-colors">
                    <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="w-full text-center">
                    <span className="text-[10px] font-mono-code text-amber-400 font-bold block">
                      #{c.index}
                    </span>
                    <span className="text-xs font-oracle font-semibold text-neutral-200 truncate block">
                      {c.name}
                    </span>
                  </div>

                  {/* Word Associations preview */}
                  <div className="flex flex-wrap items-center justify-center gap-1 w-full pt-1">
                    {c.keywords.slice(0, 2).map((w, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] font-mono-code text-neutral-400 bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded truncate max-w-full"
                      >
                        {w}
                      </span>
                    ))}
                    {c.keywords.length > 2 && (
                      <span className="text-[9px] font-mono-code text-neutral-500">
                        +{c.keywords.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Focused Card Association & Reading Modal from Deck Inspector */}
      {editingCardInDeck && inspectingDeck && (
        <CardDetailsModal
          card={editingCardInDeck}
          isReversed={false}
          deckName={inspectingDeck.name}
          deckId={inspectingDeck.id}
          onClose={() => setEditingCardInDeck(null)}
          onAssociationsUpdated={(newKeywords) => {
            if (onCardAssociationsChanged) {
              onCardAssociationsChanged(inspectingDeck.id, editingCardInDeck.index, newKeywords);
            }
            // Update local inspectingDeck state as well
            setInspectingDeck((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                cards: prev.cards.map((card) =>
                  card.index === editingCardInDeck.index
                    ? { ...card, keywords: newKeywords }
                    : card
                )
              };
            });
            setEditingCardInDeck((prev) => prev ? { ...prev, keywords: newKeywords } : null);
          }}
        />
      )}
    </div>
  );
};
