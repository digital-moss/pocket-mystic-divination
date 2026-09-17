import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Save, 
  RotateCw, 
  Sparkles, 
  Tag, 
  Check, 
  Share2,
  Plus,
  RotateCcw,
  Hash
} from 'lucide-react';
import { ParsedCard } from '../types';
import { saveJournalEntry } from '../services/journalStorage';
import { 
  getCardAssociations, 
  addCardAssociation, 
  removeCardAssociation, 
  resetCardAssociations,
  getSuggestionsForCard 
} from '../services/cardAssociations';
import { haptics } from '../services/haptics';

interface CardDetailsModalProps {
  card: ParsedCard;
  isReversed: boolean;
  deckName: string;
  deckId?: string;
  onClose: () => void;
  onSavedToJournal?: () => void;
  onAssociationsUpdated?: (newKeywords: string[]) => void;
}

export const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  card,
  isReversed,
  deckName,
  deckId = 'default-deck',
  onClose,
  onSavedToJournal,
  onAssociationsUpdated
}) => {
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Daily Draw']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Active word associations for this card (with user additions and removals)
  const [associations, setAssociations] = useState<string[]>(() => {
    return getCardAssociations(deckId, card.index, card.name, card.keywords);
  });
  const [newAssociationInput, setNewAssociationInput] = useState('');

  const suggestions = getSuggestionsForCard(card.name, associations);

  const handleAddAssociation = (word?: string) => {
    const wordToAdd = word || newAssociationInput;
    if (!wordToAdd.trim()) return;

    haptics.triggerTouch();
    const updated = addCardAssociation(deckId, card.index, card.name, wordToAdd, card.keywords);
    setAssociations(updated);
    setNewAssociationInput('');
    if (onAssociationsUpdated) {
      onAssociationsUpdated(updated);
    }
  };

  const handleRemoveAssociation = (wordToRemove: string) => {
    haptics.triggerTouch();
    const updated = removeCardAssociation(deckId, card.index, card.name, wordToRemove, card.keywords);
    setAssociations(updated);
    if (onAssociationsUpdated) {
      onAssociationsUpdated(updated);
    }
  };

  const handleResetAssociations = () => {
    haptics.triggerTouch();
    const restored = resetCardAssociations(deckId, card.index, card.name, card.keywords);
    setAssociations(restored);
    if (onAssociationsUpdated) {
      onAssociationsUpdated(restored);
    }
  };

  const availableTags = ['Daily Draw', 'Guidance', 'Work & Craft', 'Relationships', 'Shadow Work', 'Meditation'];

  const toggleTag = (tag: string) => {
    haptics.triggerTouch();
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !selectedTags.includes(customTagInput.trim())) {
      setSelectedTags([...selectedTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const handleSaveJournal = () => {
    haptics.triggerCardReveal();
    saveJournalEntry({
      cardIndex: card.index,
      cardName: card.name,
      deckName,
      deckType: card.deckType,
      isReversed,
      timestamp: Date.now(),
      notes,
      tags: selectedTags,
      cardImageUrl: card.imageUrl
    });

    setIsSaved(true);
    if (onSavedToJournal) {
      onSavedToJournal();
    }
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleCopyReading = () => {
    haptics.triggerTouch();
    const text = `✦ Pocket Mystic Draw: ${card.name} ${isReversed ? '(Reversed)' : '(Upright)'}\nDeck: ${deckName}\nWord Associations: ${associations.join(', ')}\nMeaning: ${isReversed && card.meaningReversed ? card.meaningReversed : card.meaningUpright}\n\nReflection: ${notes}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-[#141414] border border-[#2b2b2b] rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#111111]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-mono-code text-xs tracking-wider text-neutral-300 font-bold uppercase">
              ORACLE READING & JOURNAL
            </span>
          </div>
          <button
            id="btn-close-modal"
            onClick={() => {
              haptics.triggerTouch();
              onClose();
            }}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Card Showcase Row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-[#181818] p-4 rounded-xl border border-neutral-800">
            {/* Card Thumbnail */}
            <div className="w-28 sm:w-32 aspect-[1/1.62] rounded-lg overflow-hidden border border-neutral-700 shadow-md flex-shrink-0 relative">
              <img
                src={card.imageUrl}
                alt={card.name}
                className={`w-full h-full object-cover ${isReversed ? 'rotate-180' : ''}`}
              />
            </div>

            {/* Details */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="font-oracle text-xl font-bold text-neutral-100">
                  {card.name}
                </h3>
                {isReversed && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono-code bg-amber-950/60 border border-amber-800 text-amber-300 px-2 py-0.5 rounded">
                    <RotateCw className="w-2.5 h-2.5 rotate-180" />
                    REVERSED
                  </span>
                )}
                {card.arcana && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono-code px-2 py-0.5 rounded border uppercase tracking-wider ${
                    card.arcana === 'major'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                      : 'bg-sky-950/60 border-sky-800 text-sky-300'
                  }`}>
                    {card.arcana === 'major' ? 'Major Arcana' : `Minor Arcana${card.suit ? ` • ${card.suit}` : ''}`}
                  </span>
                )}
              </div>

              <div className="text-xs font-mono-code text-neutral-400">
                <span>{deckName}</span>
                {card.element && (
                  <span className="ml-2 text-neutral-500">• {card.element}</span>
                )}
              </div>
            </div>
          </div>

          {/* User-Editable Word Associations Section */}
          <div className="bg-[#181818] p-4 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-mono-code font-bold text-neutral-200 uppercase tracking-wider">
                  Word Associations ({associations.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleResetAssociations}
                title="Reset word associations to default"
                className="text-[10px] font-mono-code text-neutral-500 hover:text-neutral-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* Removable Association Chips */}
            <div className="flex flex-wrap gap-1.5">
              {associations.map((word) => (
                <span
                  key={word}
                  className="group inline-flex items-center gap-1.5 text-xs font-mono-code text-neutral-200 bg-[#121212] border border-neutral-700/80 hover:border-neutral-500 px-2.5 py-1 rounded-md transition-all shadow-sm"
                >
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssociation(word)}
                    title={`Remove "${word}" association`}
                    className="text-neutral-500 hover:text-red-400 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {associations.length === 0 && (
                <span className="text-xs font-mono-code text-neutral-500 italic">
                  No word associations yet. Add one below!
                </span>
              )}
            </div>

            {/* Input to add a new word association */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newAssociationInput}
                onChange={(e) => setNewAssociationInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAssociation();
                  }
                }}
                placeholder="Add custom word association (e.g. Breakthrough, Harmony)..."
                className="flex-1 bg-[#111111] border border-neutral-700/80 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs font-mono-code text-neutral-200 placeholder-neutral-600 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => handleAddAssociation()}
                disabled={!newAssociationInput.trim()}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 rounded-lg text-xs font-mono-code flex items-center gap-1 transition-colors border border-neutral-700"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>Add</span>
              </button>
            </div>

            {/* Suggested Word Associations */}
            {suggestions.length > 0 && (
              <div className="pt-2 border-t border-neutral-800/80">
                <span className="text-[10px] font-mono-code text-neutral-500 block mb-1.5">
                  Common Suggestions (click to add):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleAddAssociation(suggested)}
                      className="text-[10px] font-mono-code text-amber-300/80 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-800/40 hover:border-amber-600/60 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                    >
                      <span>+ {suggested}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divination Interpretations */}
          <div className="space-y-3">
            <div className="bg-[#181818] p-3.5 rounded-xl border border-neutral-800">
              <h4 className="text-xs font-mono-code font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>✦</span> {isReversed ? 'Reversed Meaning & Shadow Aspect' : 'Upright Meaning & Core Wisdom'}
              </h4>
              <p className="text-sm text-neutral-200 leading-relaxed font-sans">
                {isReversed && card.meaningReversed ? card.meaningReversed : card.meaningUpright}
              </p>
            </div>

            {/* Alternate Orientation Meaning */}
            <div className="bg-[#141414] p-3 rounded-xl border border-neutral-800/60">
              <h5 className="text-[11px] font-mono-code text-neutral-400 uppercase tracking-wider mb-1">
                {isReversed ? 'Upright Meaning Reference' : 'Reversed Meaning Reference'}
              </h5>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                {isReversed ? card.meaningUpright : (card.meaningReversed || 'Inversion highlights internal processing, blockage, or delayed externalization of this archetype.')}
              </p>
            </div>
          </div>

          {/* Offline Reflection Note (Room Journal integration) */}
          <div className="space-y-2">
            <label className="block text-xs font-mono-code text-neutral-300 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Personal Reflection (Room DB Log)</span>
              <span className="text-[10px] text-neutral-500 font-normal">Offline Persistent</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What questions or intuitive insights does this card evoke for your day? Note your impressions here..."
              rows={3}
              className="w-full bg-[#111111] border border-neutral-700 focus:border-amber-500 rounded-xl p-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono-code text-neutral-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-neutral-500" />
              Categorize Reading:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-[10px] font-mono-code px-2.5 py-1 rounded-full border transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-semibold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {selectedTags.includes(tag) ? '✓ ' : ''}{tag}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                placeholder="Add custom tag..."
                className="bg-[#111111] border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-mono-code"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#222222] bg-[#111111]">
          <button
            id="btn-copy-reading"
            onClick={handleCopyReading}
            className="flex items-center gap-1.5 text-xs font-mono-code text-neutral-400 hover:text-neutral-200 py-1.5 px-2 rounded hover:bg-neutral-800 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Text</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-modal"
              onClick={() => {
                haptics.triggerTouch();
                onClose();
              }}
              className="px-4 py-2 text-xs font-mono-code text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Close
            </button>
            <button
              id="btn-save-journal"
              onClick={handleSaveJournal}
              disabled={isSaved}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono-code font-bold transition-all shadow-md ${
                isSaved
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950'
              }`}
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'SAVED TO JOURNAL' : 'SAVE TO JOURNAL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

