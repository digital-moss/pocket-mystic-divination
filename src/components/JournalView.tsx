import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Search, 
  Trash2, 
  Download, 
  RotateCw, 
  Edit3, 
  Check, 
  Calendar,
  Sparkles,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { JournalEntry } from '../types';
import { 
  getJournalEntries, 
  updateJournalNotes, 
  deleteJournalEntry, 
  exportJournalToMarkdown,
  exportJournalToCsv,
  importJournalFile
} from '../services/journalStorage';
import { haptics } from '../services/haptics';

interface JournalViewProps {
  onNavigateToDraw: () => void;
}

export const JournalView: React.FC<JournalViewProps> = ({ onNavigateToDraw }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const reloadEntries = () => {
    setEntries(getJournalEntries());
  };

  useEffect(() => {
    reloadEntries();
  }, []);

  const handleDelete = (id: string) => {
    haptics.triggerTouch();
    if (confirm('Delete this journal entry?')) {
      deleteJournalEntry(id);
      reloadEntries();
    }
  };

  const handleStartEdit = (entry: JournalEntry) => {
    haptics.triggerTouch();
    setEditingId(entry.id);
    setEditNotes(entry.notes);
  };

  const handleSaveEdit = (id: string) => {
    haptics.triggerTouch();
    updateJournalNotes(id, editNotes);
    setEditingId(null);
    reloadEntries();
  };

  const handleExportCsv = () => {
    haptics.triggerTouch();
    const csv = exportJournalToCsv(entries);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocket_mystic_readings_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    haptics.triggerTouch();
    const md = exportJournalToMarkdown(entries);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocket_mystic_journal_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    haptics.triggerTouch();
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportStatus(null);
    haptics.triggerTouch();

    try {
      const result = await importJournalFile(file);
      if (result.error) {
        setImportStatus({ type: 'error', message: result.error });
      } else {
        haptics.triggerCardReveal();
        reloadEntries();
        const skipMsg = result.skippedCount > 0 ? ` (${result.skippedCount} existing duplicates preserved)` : '';
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${result.importedCount} reading${result.importedCount === 1 ? '' : 's'}${skipMsg}. Your journal is restored!`
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to import journal file';
      setImportStatus({ type: 'error', message: msg });
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  // Extract all unique tags
  const allTags = Array.from(
    new Set(entries.flatMap((e) => e.tags || []))
  );

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.cardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.deckName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag =
      selectedTag === 'all' || (entry.tags && entry.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-lg font-oracle font-bold text-neutral-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>OFFLINE DRAW JOURNAL (ROOM DB SYNC)</span>
          </h2>
          <p className="text-xs font-mono-code text-neutral-400 mt-1">
            Persisted history of your daily readings, cards, upright/reversed states, and reflections
          </p>
        </div>

        {/* Action Controls: Import & Exports */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input for CSV/JSON imports */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json,text/plain"
            className="hidden"
            onChange={handleFileSelected}
          />

          <button
            id="btn-import-journal"
            onClick={handleImportClick}
            disabled={isImporting}
            title="Import readings from CSV or backup file (transfer from another phone)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 hover:border-sky-500/60 rounded-lg text-xs font-mono-code transition-colors shadow-sm disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>{isImporting ? 'Importing...' : 'Import CSV'}</span>
          </button>

          {entries.length > 0 && (
            <>
              <button
                id="btn-export-csv"
                onClick={handleExportCsv}
                title="Export all readings as CSV spreadsheet"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 hover:border-emerald-500/50 rounded-lg text-xs font-mono-code transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                id="btn-export-journal"
                onClick={handleExportMarkdown}
                title="Export all readings as Markdown document"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 hover:border-amber-500/50 rounded-lg text-xs font-mono-code transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Markdown (.md)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Import Status Notification Banner */}
      {importStatus && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono-code animate-in fade-in transition-all ${
            importStatus.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
              : 'bg-red-950/40 border-red-800/80 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
          <button
            onClick={() => setImportStatus(null)}
            className="p-1 hover:bg-neutral-800/80 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Tag Filter */}
      {entries.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards, decks, or reflections..."
              className="w-full bg-[#141414] border border-neutral-800 focus:border-neutral-600 rounded-xl pl-9 pr-3 py-2 text-xs font-mono-code text-neutral-200 placeholder-neutral-600 focus:outline-none"
            />
          </div>

          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedTag('all')}
                className={`text-[11px] font-mono-code px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                  selectedTag === 'all'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-[#141414] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All ({entries.length})
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`text-[11px] font-mono-code px-2.5 py-1 rounded-lg border whitespace-nowrap transition-colors ${
                    selectedTag === tag
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-[#141414] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Journal Entries List */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-3">
          {filteredEntries.map((entry) => {
            const dateStr = new Date(entry.timestamp).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short'
            });
            const isEditing = editingId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-[#141414] border border-neutral-800/80 hover:border-neutral-700/80 rounded-xl p-4 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Card Thumbnail */}
                  <div className="w-14 sm:w-16 aspect-[1/1.6] rounded-md overflow-hidden border border-neutral-700 flex-shrink-0 bg-neutral-900">
                    <img
                      src={entry.cardImageUrl}
                      alt={entry.cardName}
                      className={`w-full h-full object-cover ${entry.isReversed ? 'rotate-180' : ''}`}
                    />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-oracle text-base font-bold text-neutral-100">
                          {entry.cardName}
                        </h4>
                        {entry.isReversed && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono-code bg-amber-950/60 border border-amber-800 text-amber-300 px-1.5 py-0.5 rounded">
                            <RotateCw className="w-2.5 h-2.5 rotate-180" />
                            REVERSED
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono-code text-neutral-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-600" />
                        {dateStr}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono-code text-neutral-400 mt-0.5">
                      Deck: <span className="text-neutral-300">{entry.deckName}</span>
                    </div>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-mono-code bg-neutral-900 text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Reflection Note */}
                    <div className="mt-2.5">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={3}
                            className="w-full bg-[#181818] border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(entry.id)}
                              className="px-2.5 py-1 bg-amber-500 text-neutral-950 font-bold rounded text-xs font-mono-code flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Save Note
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 text-neutral-400 hover:text-neutral-200 text-xs font-mono-code"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-[#181818] p-2.5 rounded-lg border border-neutral-800/60">
                          {entry.notes ? entry.notes : (
                            <span className="italic text-neutral-500">No personal reflection note added yet.</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 text-neutral-500">
                    {!isEditing && (
                      <button
                        onClick={() => handleStartEdit(entry)}
                        title="Edit reflection note"
                        className="p-1.5 hover:text-neutral-200 rounded hover:bg-neutral-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      title="Delete entry"
                      className="p-1.5 hover:text-red-400 rounded hover:bg-neutral-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-[#141414] border border-neutral-800 rounded-2xl p-8 space-y-6">
          <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-amber-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-mono-code font-bold text-neutral-200">
              NO DRAWS LOGGED IN JOURNAL
            </h3>
            <p className="text-xs font-mono-code text-neutral-500 max-w-sm mx-auto">
              Whenever you draw and inspect a card, click "Save to Journal" to log reflections into offline storage.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="btn-empty-draw"
              onClick={() => {
                haptics.triggerTouch();
                onNavigateToDraw();
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs font-mono-code inline-flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Draw Today's Card</span>
            </button>

            <button
              id="btn-empty-import"
              onClick={handleImportClick}
              disabled={isImporting}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 hover:border-sky-500/60 rounded-xl text-xs font-mono-code inline-flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span>{isImporting ? 'Importing...' : 'Import from Backup / New Phone'}</span>
            </button>
          </div>

          <p className="text-[11px] font-mono-code text-neutral-500 max-w-xs mx-auto">
            Got a new phone? Upload your exported <span className="text-neutral-400 font-bold">.csv</span> readings file to restore your full draw history.
          </p>
        </div>
      )}
    </div>
  );
};
