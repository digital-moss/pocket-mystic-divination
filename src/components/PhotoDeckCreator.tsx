import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  Trash2, 
  Plus, 
  X, 
  RotateCw, 
  FlipHorizontal, 
  Eye, 
  Layers, 
  Hash, 
  HelpCircle,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from 'lucide-react';
import { ParsedCard, Deck } from '../types';
import { 
  populateCardData, 
  analyzeCardPhotoWithAI, 
  PopulatedCardData 
} from '../services/cardAutoPopulator';
import { saveCustomDeckToStorage } from '../services/deckImporter';
import { haptics } from '../services/haptics';

interface StagedPhotoCard {
  id: string;
  imageBlobUrl: string;
  name: string;
  keywords: string[];
  meaningUpright: string;
  meaningReversed: string;
  element: string;
  isAnalyzing: boolean;
  analyzedWithAI: boolean;
}

interface PhotoDeckCreatorProps {
  onDeckCreated: (newDeck: Deck) => void;
  onCancel: () => void;
}

export const PhotoDeckCreator: React.FC<PhotoDeckCreatorProps> = ({
  onDeckCreated,
  onCancel
}) => {
  // Mode: 'camera' or 'upload'
  const [activeMode, setActiveMode] = useState<'camera' | 'upload'>('camera');
  const [deckName, setDeckName] = useState('My Custom Photo Deck');
  const [deckDescription, setDeckDescription] = useState('Personal deck imported via camera capture');
  const [deckTheme, setDeckTheme] = useState<'tarot' | 'oracle' | 'runic'>('tarot');
  const [stagedCards, setStagedCards] = useState<StagedPhotoCard[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSaving, setIsSaving] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [newWordInputs, setNewWordInputs] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. You can still upload card photos from your camera roll or files!'
          : 'Unable to start camera stream. Use file upload to import photos directly.'
      );
      setCameraActive(false);
    }
  }, [facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeMode, startCamera, stopCamera]);

  // Switch facing mode (front/back)
  const toggleFacingMode = () => {
    haptics.triggerTouch();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from live video
  const capturePhoto = async () => {
    if (!videoRef.current || !cameraActive) return;

    haptics.triggerCardReveal();

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    const newIndex = stagedCards.length;
    const populated = populateCardData(newIndex, undefined, deckTheme);

    const newCard: StagedPhotoCard = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      imageBlobUrl: dataUrl,
      name: populated.name,
      keywords: populated.keywords,
      meaningUpright: populated.meaningUpright,
      meaningReversed: populated.meaningReversed,
      element: populated.element,
      isAnalyzing: false,
      analyzedWithAI: false
    };

    setStagedCards((prev) => [...prev, newCard]);

    // Background AI analysis if available
    triggerAIAnalysis(newCard.id, dataUrl, newIndex);
  };

  // Process uploaded photo files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    haptics.triggerTouch();
    const files = Array.from(e.target.files);
    const baseIndex = stagedCards.length;

    files.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const cardIndex = baseIndex + i;
        
        // Clean filename into potential card name
        const cleanFileName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/^\d+\s*/, '');
        
        const populated = populateCardData(
          cardIndex, 
          cleanFileName.length > 2 ? cleanFileName : undefined, 
          deckTheme
        );

        const newCard: StagedPhotoCard = {
          id: `photo_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          imageBlobUrl: dataUrl,
          name: populated.name,
          keywords: populated.keywords,
          meaningUpright: populated.meaningUpright,
          meaningReversed: populated.meaningReversed,
          element: populated.element,
          isAnalyzing: false,
          analyzedWithAI: false
        };

        setStagedCards((prev) => [...prev, newCard]);
        triggerAIAnalysis(newCard.id, dataUrl, cardIndex);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Run AI analysis on a specific photo
  const triggerAIAnalysis = async (cardId: string, imageBase64: string, index: number) => {
    setStagedCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, isAnalyzing: true } : c))
    );

    const result = await analyzeCardPhotoWithAI(imageBase64, index);

    setStagedCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        if (!result) return { ...c, isAnalyzing: false };
        return {
          ...c,
          name: result.name || c.name,
          keywords: result.keywords.length > 0 ? result.keywords : c.keywords,
          meaningUpright: result.meaningUpright || c.meaningUpright,
          meaningReversed: result.meaningReversed || c.meaningReversed,
          element: result.element || c.element,
          isAnalyzing: false,
          analyzedWithAI: true
        };
      })
    );
  };

  // Remove card from staged list
  const handleRemoveCard = (id: string) => {
    haptics.triggerTouch();
    setStagedCards((prev) => prev.filter((c) => c.id !== id));
  };

  // Add word association to a staged card
  const handleAddKeyword = (cardId: string) => {
    const inputVal = (newWordInputs[cardId] || '').trim();
    if (!inputVal) return;

    haptics.triggerTouch();
    setStagedCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        if (c.keywords.some((w) => w.toLowerCase() === inputVal.toLowerCase())) return c;
        return { ...c, keywords: [...c.keywords, inputVal] };
      })
    );

    setNewWordInputs((prev) => ({ ...prev, [cardId]: '' }));
  };

  // Remove word association from a staged card
  const handleRemoveKeyword = (cardId: string, word: string) => {
    haptics.triggerTouch();
    setStagedCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        return { ...c, keywords: c.keywords.filter((w) => w !== word) };
      })
    );
  };

  // Move card up/down
  const moveCard = (index: number, direction: 'up' | 'down') => {
    haptics.triggerTouch();
    setStagedCards((prev) => {
      const next = [...prev];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIdx];
      next[targetIdx] = temp;
      return next;
    });
  };

  // Save the custom deck into storage
  const handleFinalizeDeck = () => {
    if (stagedCards.length === 0) return;

    setIsSaving(true);
    haptics.triggerCardReveal();

    const deckId = `deck_photo_${Date.now()}`;
    const parsedCards: ParsedCard[] = stagedCards.map((c, i) => ({
      index: i,
      name: c.name,
      keywords: c.keywords,
      meaningUpright: c.meaningUpright,
      meaningReversed: c.meaningReversed,
      element: c.element,
      imageUrl: c.imageBlobUrl,
      deckType: 'custom'
    }));

    const newDeck: Deck = {
      id: deckId,
      name: deckName.trim() || 'My Photo Deck',
      description: deckDescription.trim() || `${stagedCards.length} cards imported via camera capture`,
      cardCount: parsedCards.length,
      cards: parsedCards,
      isCustom: true,
      accentColor: '#38bdf8'
    };

    saveCustomDeckToStorage(newDeck);
    stopCamera();
    onDeckCreated(newDeck);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-oracle font-bold text-neutral-100">
              PHOTO DECK IMPORTER & AUTO-POPULATOR
            </h2>
          </div>
          <p className="text-xs font-mono-code text-neutral-400 mt-1">
            Snap photos of physical cards — the app automatically populates names, word associations, and meanings
          </p>
        </div>

        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="self-start sm:self-auto px-3 py-1.5 text-xs font-mono-code text-neutral-400 hover:text-neutral-200 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Mode Selector & Deck Config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deck Details */}
        <div className="bg-[#141414] p-4 rounded-xl border border-neutral-800 space-y-3">
          <label className="text-[11px] font-mono-code text-neutral-400 uppercase tracking-wider font-bold block">
            1. Deck Name & Archetype
          </label>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="e.g. My Hand-Drawn Tarot"
            className="w-full bg-[#181818] border border-neutral-700 rounded-lg px-3 py-1.5 text-xs font-mono-code text-neutral-200 focus:outline-none focus:border-sky-500"
          />

          <div className="flex gap-1.5 pt-1">
            {(['tarot', 'oracle', 'runic'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDeckTheme(t)}
                className={`flex-1 py-1 text-[10px] font-mono-code rounded border uppercase transition-colors ${
                  deckTheme === t
                    ? 'bg-sky-950/60 border-sky-500 text-sky-300 font-bold'
                    : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Input Source Buttons */}
        <div className="md:col-span-2 bg-[#141414] p-4 rounded-xl border border-neutral-800 flex flex-col justify-between space-y-3">
          <label className="text-[11px] font-mono-code text-neutral-400 uppercase tracking-wider font-bold block">
            2. Choose Photo Intake Method
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                haptics.triggerTouch();
                setActiveMode('camera');
              }}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-colors ${
                activeMode === 'camera'
                  ? 'bg-sky-950/40 border-sky-500 text-sky-200'
                  : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Camera className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-mono-code font-bold">Live Camera Viewfinder</span>
              <span className="text-[10px] text-neutral-500 font-mono-code">Snap cards one by one</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptics.triggerTouch();
                setActiveMode('upload');
                fileInputRef.current?.click();
              }}
              className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-colors ${
                activeMode === 'upload'
                  ? 'bg-sky-950/40 border-sky-500 text-sky-200'
                  : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Upload className="w-5 h-5 text-sky-400" />
              <span className="text-xs font-mono-code font-bold">Upload Photos / Camera</span>
              <span className="text-[10px] text-neutral-500 font-mono-code">Select multiple card images</span>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
          />
        </div>
      </div>

      {/* Live Camera Viewfinder Screen */}
      {activeMode === 'camera' && (
        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="relative aspect-[4/3] max-w-md mx-auto bg-black rounded-xl overflow-hidden border border-neutral-700 flex items-center justify-center">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Card Framing Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[60%] aspect-[1/1.5] border-2 border-dashed border-sky-400/80 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                    <span className="text-[10px] font-mono-code text-sky-300/80 bg-black/60 px-2 py-0.5 rounded">
                      Align Card Here
                    </span>
                  </div>
                </div>

                {/* Camera Flip Button */}
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-neutral-300 border border-neutral-700 transition-colors"
                  title="Switch camera"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="p-6 text-center space-y-2">
                <Camera className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs font-mono-code text-neutral-400">
                  {cameraError || 'Starting video viewfinder...'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-200 rounded text-xs font-mono-code"
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>

          {/* Shutter Button */}
          {cameraActive && (
            <div className="flex flex-col items-center justify-center space-y-2">
              <button
                type="button"
                id="btn-shutter-snap"
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-sky-500 hover:bg-sky-400 active:scale-95 text-neutral-950 flex items-center justify-center shadow-lg transition-transform border-4 border-neutral-900 ring-2 ring-sky-400"
                title="Capture card photo"
              >
                <Camera className="w-7 h-7" />
              </button>
              <span className="text-xs font-mono-code text-neutral-400">
                Tap to snap photo & auto-populate data ({stagedCards.length} cards captured)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Upload Drop / Intake Zone */}
      {activeMode === 'upload' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-700 hover:border-sky-500 bg-[#141414] hover:bg-[#181818] rounded-2xl p-6 text-center cursor-pointer transition-all"
        >
          <Upload className="w-8 h-8 text-sky-400 mx-auto mb-2" />
          <h3 className="text-xs font-mono-code font-bold text-neutral-200">
            CHOOSE OR TAKE CARD PHOTOS
          </h3>
          <p className="text-[11px] font-mono-code text-neutral-500 mt-1 max-w-sm mx-auto">
            Select single or multiple photos. Pocket Mystic instantly imports them and generates card associations and meanings.
          </p>
        </div>
      )}

      {/* Staged Cards Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-mono-code font-bold text-neutral-200 uppercase tracking-wider">
              Captured Deck Cards ({stagedCards.length})
            </h3>
          </div>

          {stagedCards.length > 0 && (
            <button
              type="button"
              onClick={handleFinalizeDeck}
              disabled={isSaving}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-mono-code font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Import & Save Deck ({stagedCards.length} Cards)</span>
            </button>
          )}
        </div>

        {stagedCards.length === 0 ? (
          <div className="p-8 bg-[#141414] border border-neutral-800 rounded-xl text-center">
            <p className="text-xs font-mono-code text-neutral-500">
              No photos captured yet. Use the camera viewfinder or file selector above to snap your physical deck cards!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stagedCards.map((card, index) => {
              const isEditing = editingCardId === card.id;

              return (
                <div
                  key={card.id}
                  className="bg-[#141414] border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 sm:p-4 transition-colors flex flex-col sm:flex-row gap-4"
                >
                  {/* Thumbnail */}
                  <div className="w-20 sm:w-24 aspect-[1/1.5] rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900 flex-shrink-0 relative group">
                    <img
                      src={card.imageBlobUrl}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono-code text-sky-400 font-bold">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Card Content & Metadata */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <input
                            type="text"
                            value={card.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStagedCards((prev) =>
                                prev.map((c) => (c.id === card.id ? { ...c, name: val } : c))
                              );
                            }}
                            className="bg-[#181818] border border-neutral-700 rounded px-2 py-0.5 text-xs font-oracle font-bold text-neutral-100"
                          />
                        ) : (
                          <h4 className="font-oracle text-sm font-bold text-neutral-100">
                            {card.name}
                          </h4>
                        )}

                        <span className="text-[10px] font-mono-code bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                          {card.element}
                        </span>

                        {card.analyzedWithAI && (
                          <span className="text-[9px] font-mono-code bg-indigo-950/60 border border-indigo-800 text-indigo-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> AI Analyzed
                          </span>
                        )}

                        {card.isAnalyzing && (
                          <span className="text-[9px] font-mono-code text-sky-400 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 animate-spin" /> Analyzing image...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveCard(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-400"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveCard(index, 'down')}
                          disabled={index === stagedCards.length - 1}
                          className="p-1 rounded hover:bg-neutral-800 disabled:opacity-30 text-neutral-400"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCard(card.id)}
                          className="p-1 rounded hover:bg-red-950/50 text-neutral-500 hover:text-red-400"
                          title="Remove card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Word Associations (Add/Remove) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] font-mono-code text-neutral-400">
                        <Hash className="w-3 h-3 text-sky-400" />
                        <span>Word Associations:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {card.keywords.map((word) => (
                          <span
                            key={word}
                            className="inline-flex items-center gap-1 text-[10px] font-mono-code bg-[#1a1a1a] text-neutral-200 border border-neutral-700/80 px-2 py-0.5 rounded"
                          >
                            <span>{word}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveKeyword(card.id, word)}
                              className="text-neutral-500 hover:text-red-400"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}

                        {/* Add keyword input */}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={newWordInputs[card.id] || ''}
                            onChange={(e) =>
                              setNewWordInputs((prev) => ({
                                ...prev,
                                [card.id]: e.target.value
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddKeyword(card.id);
                              }
                            }}
                            placeholder="+ Add word"
                            className="w-20 bg-[#121212] border border-neutral-800 rounded px-1.5 py-0.5 text-[10px] font-mono-code text-neutral-300 focus:outline-none focus:border-sky-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddKeyword(card.id)}
                            className="text-[10px] font-mono-code bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Meanings */}
                    <div className="text-[11px] text-neutral-300 space-y-1 pt-1">
                      <p>
                        <span className="font-mono-code text-neutral-500 font-bold mr-1.5">
                          UPRIGHT:
                        </span>
                        {card.meaningUpright}
                      </p>
                      <p>
                        <span className="font-mono-code text-neutral-500 font-bold mr-1.5">
                          REVERSED:
                        </span>
                        {card.meaningReversed}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Save Action */}
      {stagedCards.length > 0 && (
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-xs font-mono-code text-neutral-400">
            Total {stagedCards.length} cards ready to import
          </span>

          <button
            type="button"
            id="btn-finalize-deck"
            onClick={handleFinalizeDeck}
            disabled={isSaving}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-mono-code font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Finish & Open Deck in Daily Draw</span>
          </button>
        </div>
      )}
    </div>
  );
};
