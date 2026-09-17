import { JournalEntry, ParsedCard } from '../types';
import { INITIAL_DECKS } from '../data/defaultDecks';

const OLD_JOURNAL_KEY = 'pocket_oracle_draw_journal';
const JOURNAL_KEY = 'pocket_mystic_draw_journal';

export function getJournalEntries(): JournalEntry[] {
  try {
    let raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_JOURNAL_KEY);
      if (oldRaw) {
        raw = oldRaw;
        localStorage.setItem(JOURNAL_KEY, oldRaw);
      }
    }
    if (!raw) return [];
    const entries: JournalEntry[] = JSON.parse(raw);
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function saveJournalEntry(entry: Omit<JournalEntry, 'id'> & { id?: string }): JournalEntry {
  const entries = getJournalEntries();
  const id = entry.id || `draw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const fullEntry: JournalEntry = {
    ...entry,
    id
  };

  const existingIndex = entries.findIndex((e) => e.id === id);
  if (existingIndex >= 0) {
    entries[existingIndex] = fullEntry;
  } else {
    entries.unshift(fullEntry);
  }

  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save journal to localStorage:', err);
  }

  return fullEntry;
}

export function updateJournalNotes(id: string, notes: string, tags: string[] = []): boolean {
  const entries = getJournalEntries();
  const entry = entries.find((e) => e.id === id);
  if (!entry) return false;

  entry.notes = notes;
  if (tags.length > 0) {
    entry.tags = tags;
  }

  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function deleteJournalEntry(id: string): boolean {
  try {
    const entries = getJournalEntries().filter((e) => e.id !== id);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function exportJournalToMarkdown(entries: JournalEntry[]): string {
  let md = '# Pocket Mystic — Draw Journal\n\n';
  md += '*Customizable Divination Tool - Tarot, Runes, I-Ching*\n\n';
  md += `*Exported on ${new Date().toLocaleDateString()} — ${entries.length} readings*\n\n---\n\n`;

  entries.forEach((entry) => {
    const dateStr = new Date(entry.timestamp).toLocaleString();
    md += `### ${entry.cardName} ${entry.isReversed ? '(Reversed)' : '(Upright)'}\n`;
    md += `- **Deck:** ${entry.deckName} (${entry.deckType})\n`;
    md += `- **Date:** ${dateStr}\n`;
    if (entry.tags && entry.tags.length > 0) {
      md += `- **Tags:** ${entry.tags.join(', ')}\n`;
    }
    if (entry.notes) {
      md += `\n**Reflection:**\n> ${entry.notes.replace(/\n/g, '\n> ')}\n`;
    }
    md += '\n---\n\n';
  });

  return md;
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportJournalToCsv(entries: JournalEntry[]): string {
  const headers = [
    'Card Drawn',
    'Reversal Status',
    'Timestamp',
    'Date Time (ISO)',
    'Deck Name',
    'Deck Type',
    'Tags',
    'Journal Notes'
  ];

  const rows = entries.map((entry) => {
    const cardDrawn = entry.cardName;
    const reversalStatus = entry.isReversed ? 'Reversed' : 'Upright';
    const timestamp = entry.timestamp;
    const dateTimeIso = new Date(entry.timestamp).toISOString();
    const deckName = entry.deckName || '';
    const deckType = entry.deckType || '';
    const tags = (entry.tags || []).join('; ');
    const journalNotes = entry.notes || '';

    return [
      escapeCsvCell(cardDrawn),
      escapeCsvCell(reversalStatus),
      escapeCsvCell(timestamp),
      escapeCsvCell(dateTimeIso),
      escapeCsvCell(deckName),
      escapeCsvCell(deckType),
      escapeCsvCell(tags),
      escapeCsvCell(journalNotes)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function exportJournalToJson(entries: JournalEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

/**
 * Robust RFC 4180-compliant CSV parser handling quoted cells,
 * escaped quotes (""), commas, and multi-line reflections.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"';
          i++; // skip escaped quote
        } else {
          insideQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++; // handle CRLF
        }
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.length > 0 && currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        if (currentRow.length > 0 && currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Generates an elegant fallback SVG card graphic for cards imported from custom decks
 * that might not exist in default local deck templates.
 */
export function createFallbackJournalCardSvg(cardName: string, deckName: string = 'Custom Deck'): string {
  const accent = '#c5a059';
  const cleanName = cardName.replace(/[<>&"]/g, '');
  const cleanDeck = deckName.replace(/[<>&"]/g, '');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 520" width="100%" height="100%">
  <rect width="320" height="520" rx="14" fill="#131313" />
  <rect x="14" y="14" width="292" height="492" rx="8" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.6" />
  <rect x="22" y="22" width="276" height="476" rx="6" fill="none" stroke="${accent}" stroke-width="0.5" stroke-dasharray="6 3" opacity="0.4" />
  <text x="160" y="60" fill="${accent}" font-family="monospace" font-size="11" letter-spacing="3" text-anchor="middle" opacity="0.8">
    ${cleanDeck.toUpperCase()}
  </text>
  <circle cx="160" cy="240" r="80" fill="#181818" stroke="${accent}" stroke-width="0.8" opacity="0.8" />
  <text x="160" y="255" fill="${accent}" font-family="'Cinzel', serif" font-size="44" text-anchor="middle" opacity="0.9">✦</text>
  <text x="160" y="445" fill="#f4ede0" font-family="'Cinzel', Georgia, serif" font-size="16" font-weight="700" letter-spacing="2" text-anchor="middle">
    ${cleanName.toUpperCase()}
  </text>
  <text x="160" y="470" fill="${accent}" font-family="monospace" font-size="10" letter-spacing="2" text-anchor="middle" opacity="0.65">
    POCKET MYSTIC
  </text>
</svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Searches default built-in decks to find an exact or fuzzy matching card graphic
 */
function findMatchingCard(cardName: string, deckType?: string): { imageUrl: string; index: number } | null {
  const normName = cardName.trim().toLowerCase();
  for (const deck of INITIAL_DECKS) {
    if (deckType) {
      const firstCard = deck.cards[0];
      if (firstCard && firstCard.deckType.toLowerCase() === deckType.toLowerCase()) {
        const card = deck.cards.find((c: ParsedCard) => c.name.trim().toLowerCase() === normName);
        if (card) return { imageUrl: card.imageUrl, index: card.index };
      }
    }
  }

  for (const deck of INITIAL_DECKS) {
    const card = deck.cards.find((c: ParsedCard) => c.name.trim().toLowerCase() === normName);
    if (card) return { imageUrl: card.imageUrl, index: card.index };
  }

  const stripped = normName.replace(/^the\s+/, '');
  for (const deck of INITIAL_DECKS) {
    const card = deck.cards.find((c: ParsedCard) => c.name.trim().toLowerCase().replace(/^the\s+/, '') === stripped);
    if (card) return { imageUrl: card.imageUrl, index: card.index };
  }

  return null;
}

/**
 * Merges newly parsed entries with existing stored entries, avoiding duplicates
 */
function mergeImportedEntries(newEntries: JournalEntry[]): { importedCount: number; skippedCount: number; totalCount: number } {
  const existing = getJournalEntries();
  const existingSignatures = new Set(
    existing.map((e) => `${Math.floor(e.timestamp / 1000)}::${e.cardName.trim().toLowerCase()}`)
  );
  const existingIds = new Set(existing.map((e) => e.id));

  let importedCount = 0;
  let skippedCount = 0;
  const toAdd: JournalEntry[] = [];

  for (const entry of newEntries) {
    const sig = `${Math.floor(entry.timestamp / 1000)}::${entry.cardName.trim().toLowerCase()}`;
    if (existingSignatures.has(sig) || (entry.id && existingIds.has(entry.id))) {
      skippedCount++;
    } else {
      toAdd.push(entry);
      existingSignatures.add(sig);
      if (entry.id) existingIds.add(entry.id);
      importedCount++;
    }
  }

  const combined = [...toAdd, ...existing].sort((a, b) => b.timestamp - a.timestamp);
  try {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(combined));
  } catch (err) {
    console.warn('Failed to save imported journal entries:', err);
  }

  return {
    importedCount,
    skippedCount,
    totalCount: combined.length
  };
}

export interface JournalImportResult {
  importedCount: number;
  skippedCount: number;
  totalCount: number;
  error?: string;
}

/**
 * Parses and restores journal readings from CSV text
 */
export function importJournalFromCsvText(csvText: string): JournalImportResult {
  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    return {
      importedCount: 0,
      skippedCount: 0,
      totalCount: getJournalEntries().length,
      error: 'No data rows found in CSV file.'
    };
  }

  // Check if first row is header
  const firstRow = rows[0].map((c) => c.toLowerCase());
  const hasHeader = firstRow.some(
    (c) => c.includes('card') || c.includes('deck') || c.includes('timestamp') || c.includes('note')
  );

  let colMap = {
    card: -1,
    reversal: -1,
    timestamp: -1,
    dateTime: -1,
    deckName: -1,
    deckType: -1,
    tags: -1,
    notes: -1
  };

  if (hasHeader) {
    firstRow.forEach((col, idx) => {
      if (col.includes('card') && colMap.card === -1) colMap.card = idx;
      else if (col.includes('revers') && colMap.reversal === -1) colMap.reversal = idx;
      else if (col.includes('timestamp') && colMap.timestamp === -1) colMap.timestamp = idx;
      else if (col.includes('date') && colMap.dateTime === -1) colMap.dateTime = idx;
      else if (col.includes('deck') && (col.includes('name') || !col.includes('type')) && colMap.deckName === -1) colMap.deckName = idx;
      else if ((col.includes('type') || col.includes('category')) && colMap.deckType === -1) colMap.deckType = idx;
      else if (col.includes('tag') && colMap.tags === -1) colMap.tags = idx;
      else if ((col.includes('note') || col.includes('reflection') || col.includes('journal')) && colMap.notes === -1) colMap.notes = idx;
    });
  }

  // Fallbacks if columns weren't matched
  if (colMap.card === -1) {
    colMap = {
      card: 0,
      reversal: 1,
      timestamp: 2,
      dateTime: 3,
      deckName: 4,
      deckType: 5,
      tags: 6,
      notes: 7
    };
  }

  const dataRows = hasHeader ? rows.slice(1) : rows;
  if (dataRows.length === 0) {
    return {
      importedCount: 0,
      skippedCount: 0,
      totalCount: getJournalEntries().length,
      error: 'CSV contains only header row without any reading entries.'
    };
  }

  const parsedEntries: JournalEntry[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const cardName = colMap.card < row.length ? row[colMap.card]?.trim() : '';
    if (!cardName) continue;

    const reversalStr = (colMap.reversal >= 0 && colMap.reversal < row.length ? row[colMap.reversal]?.trim().toLowerCase() : '') || '';
    const isReversed = reversalStr.includes('rev') || reversalStr === 'true' || reversalStr === '1' || reversalStr === 'yes';

    const timestampStr = colMap.timestamp >= 0 && colMap.timestamp < row.length ? row[colMap.timestamp]?.trim() : '';
    const dateTimeStr = colMap.dateTime >= 0 && colMap.dateTime < row.length ? row[colMap.dateTime]?.trim() : '';

    let timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || timestamp <= 0) {
      timestamp = Date.parse(dateTimeStr);
    }
    if (isNaN(timestamp) || timestamp <= 0) {
      timestamp = Date.now() - i * 1000;
    }

    const deckName = (colMap.deckName >= 0 && colMap.deckName < row.length ? row[colMap.deckName]?.trim() : '') || 'Imported Deck';
    const deckType = (colMap.deckType >= 0 && colMap.deckType < row.length ? row[colMap.deckType]?.trim() : '') || 'tarot';
    const tagsStr = colMap.tags >= 0 && colMap.tags < row.length ? row[colMap.tags]?.trim() : '';
    const tags = tagsStr ? tagsStr.split(/[;,]/).map((t) => t.trim()).filter(Boolean) : [];
    const notes = (colMap.notes >= 0 && colMap.notes < row.length ? row[colMap.notes]?.trim() : '') || '';

    // Match card visual or generate fallback
    const match = findMatchingCard(cardName, deckType);
    const imageUrl = match ? match.imageUrl : createFallbackJournalCardSvg(cardName, deckName);
    const cardIndex = match ? match.index : i;

    parsedEntries.push({
      id: `imported-${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
      cardIndex,
      cardName,
      deckName,
      deckType,
      isReversed,
      timestamp,
      notes,
      tags,
      cardImageUrl: imageUrl
    });
  }

  if (parsedEntries.length === 0) {
    return {
      importedCount: 0,
      skippedCount: 0,
      totalCount: getJournalEntries().length,
      error: 'Could not extract valid card readings from CSV. Please check the file structure.'
    };
  }

  return mergeImportedEntries(parsedEntries);
}

/**
 * Parses and restores journal readings from JSON text
 */
export function importJournalFromJsonText(jsonText: string): JournalImportResult {
  try {
    const raw = JSON.parse(jsonText);
    const list: unknown[] = Array.isArray(raw)
      ? raw
      : (Array.isArray((raw as Record<string, unknown>)?.entries)
        ? (raw as { entries: unknown[] }).entries
        : Array.isArray((raw as Record<string, unknown>)?.readings)
          ? (raw as { readings: unknown[] }).readings
          : []);

    if (!Array.isArray(list) || list.length === 0) {
      return {
        importedCount: 0,
        skippedCount: 0,
        totalCount: getJournalEntries().length,
        error: 'JSON file does not contain a valid array of reading entries.'
      };
    }

    const parsedEntries: JournalEntry[] = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i] as Record<string, unknown>;
      const cardName = String(item.cardName || item.card || item['Card Drawn'] || '').trim();
      if (!cardName) continue;

      const deckName = String(item.deckName || item.deck || item['Deck Name'] || 'Imported Deck');
      const deckType = String(item.deckType || item.type || item['Deck Type'] || 'tarot');
      const isReversed = Boolean(
        item.isReversed ?? (String(item.reversalStatus || item['Reversal Status'] || '').toLowerCase().includes('rev'))
      );

      const rawTs = item.timestamp ?? item['Timestamp'];
      let timestamp = typeof rawTs === 'number' ? rawTs : parseInt(String(rawTs), 10);
      if (isNaN(timestamp) || timestamp <= 0) {
        timestamp = Date.parse(String(item.dateTime || item.date || item['Date Time (ISO)'] || ''));
      }
      if (isNaN(timestamp) || timestamp <= 0) {
        timestamp = Date.now() - i * 1000;
      }

      const notes = String(item.notes || item.reflection || item['Journal Notes'] || '');
      const rawTags = item.tags || item['Tags'];
      const tags = Array.isArray(rawTags)
        ? rawTags.map(String)
        : typeof rawTags === 'string'
          ? rawTags.split(/[;,]/).map((t) => t.trim()).filter(Boolean)
          : [];

      const match = findMatchingCard(cardName, deckType);
      const imageUrl = String(
        item.cardImageUrl || (match ? match.imageUrl : createFallbackJournalCardSvg(cardName, deckName))
      );
      const cardIndex = typeof item.cardIndex === 'number' ? item.cardIndex : (match ? match.index : i);

      parsedEntries.push({
        id: String(item.id || `imported-${timestamp}-${Math.random().toString(36).substring(2, 7)}`),
        cardIndex,
        cardName,
        deckName,
        deckType,
        isReversed,
        timestamp,
        notes,
        tags,
        cardImageUrl: imageUrl
      });
    }

    if (parsedEntries.length === 0) {
      return {
        importedCount: 0,
        skippedCount: 0,
        totalCount: getJournalEntries().length,
        error: 'No valid card entries found in JSON file.'
      };
    }

    return mergeImportedEntries(parsedEntries);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON file';
    return {
      importedCount: 0,
      skippedCount: 0,
      totalCount: getJournalEntries().length,
      error: msg
    };
  }
}

/**
 * Universal file importer that reads either CSV or JSON files
 */
export async function importJournalFile(file: File): Promise<JournalImportResult> {
  try {
    const text = await file.text();
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        importedCount: 0,
        skippedCount: 0,
        totalCount: getJournalEntries().length,
        error: 'The selected file is empty.'
      };
    }

    if (file.name.endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return importJournalFromJsonText(trimmed);
    } else {
      return importJournalFromCsvText(trimmed);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to read file';
    return {
      importedCount: 0,
      skippedCount: 0,
      totalCount: getJournalEntries().length,
      error: msg
    };
  }
}
