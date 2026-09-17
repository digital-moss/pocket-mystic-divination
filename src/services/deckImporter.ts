import JSZip from 'jszip';
import { Deck, ParsedCard } from '../types';

export interface ImportResult {
  deck: Deck;
  cardCount: number;
  unparsedFiles: string[];
}

// Known Tarot names mapping for index detection
const TAROT_LOOKUP: Record<string, number> = {
  fool: 0,
  magician: 1,
  highpriestess: 2,
  priestess: 2,
  empress: 3,
  emperor: 4,
  hierophant: 5,
  lovers: 6,
  lover: 6,
  chariot: 7,
  strength: 8,
  hermit: 9,
  wheeloffortune: 10,
  wheel: 10,
  fortune: 10,
  justice: 11,
  hangedman: 12,
  death: 13,
  temperance: 14,
  devil: 15,
  tower: 16,
  star: 17,
  moon: 18,
  sun: 19,
  judgement: 20,
  judgment: 20,
  world: 21
};

export function parseFilenameToCardInfo(fileName: string): { index: number; name: string } {
  // Strip path if present (e.g. "my_deck/00_fool.png" -> "00_fool.png")
  const baseName = fileName.split('/').pop() || fileName;
  const nameWithoutExt = baseName.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '').trim();

  // Pattern 1: Leading numbers separated by underscore, dash, space, or dot (e.g., "00_fool", "01-magician", "02. priestess", "05 the hierophant")
  const prefixMatch = nameWithoutExt.match(/^(\d+)[\s_\-\.]+(.+)$/i);
  if (prefixMatch) {
    const rawIndex = parseInt(prefixMatch[1], 10);
    const rawName = prefixMatch[2].replace(/[_\-]+/g, ' ').trim();
    return {
      index: isNaN(rawIndex) ? 0 : rawIndex,
      name: formatTitleCase(rawName)
    };
  }

  // Pattern 2: Only number (e.g. "0", "1", "00", "21")
  const onlyNumMatch = nameWithoutExt.match(/^(\d+)$/);
  if (onlyNumMatch) {
    const rawIndex = parseInt(onlyNumMatch[1], 10);
    return {
      index: rawIndex,
      name: `Card #${rawIndex}`
    };
  }

  // Pattern 3: Name only without number (e.g. "The Fool", "death", "high_priestess")
  const cleanKey = nameWithoutExt.toLowerCase().replace(/[^a-z]/g, '');
  if (cleanKey in TAROT_LOOKUP) {
    const idx = TAROT_LOOKUP[cleanKey];
    return {
      index: idx,
      name: formatTitleCase(nameWithoutExt.replace(/[_\-]+/g, ' '))
    };
  }

  // Fallback: Use string as title
  return {
    index: 0,
    name: formatTitleCase(nameWithoutExt.replace(/[_\-]+/g, ' '))
  };
}

function formatTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extracts and imports a .zip file containing card deck image files
 */
export async function importDeckFromZip(
  file: File | Blob,
  customDeckName?: string
): Promise<ImportResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const rawEntries: { path: string; fileEntry: JSZip.JSZipObject }[] = [];
  const unparsedFiles: string[] = [];

  loadedZip.forEach((relativePath, fileEntry) => {
    if (fileEntry.dir) return;
    // Skip hidden files like __MACOSX or .DS_Store
    if (relativePath.includes('__MACOSX') || relativePath.startsWith('.')) return;

    if (/\.(png|jpg|jpeg|webp|svg)$/i.test(relativePath)) {
      rawEntries.push({ path: relativePath, fileEntry });
    } else {
      unparsedFiles.push(relativePath);
    }
  });

  if (rawEntries.length === 0) {
    throw new Error('No valid card images (.png, .jpg, .jpeg, .webp, .svg) found in the ZIP archive.');
  }

  // Determine deck name
  const originalFileName = (file as File).name ? (file as File).name.replace(/\.zip$/i, '') : 'Custom Deck';
  const deckName = customDeckName?.trim() || formatTitleCase(originalFileName.replace(/[_\-]+/g, ' '));

  const parsedCards: ParsedCard[] = [];

  for (let i = 0; i < rawEntries.length; i++) {
    const entry = rawEntries[i];
    const { index, name } = parseFilenameToCardInfo(entry.path);

    // Convert image to Base64 data URL so it can be rendered and persisted in local storage
    const extMatch = entry.path.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'png';
    const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    const base64Data = await entry.fileEntry.async('base64');
    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    parsedCards.push({
      index: index !== 0 || parsedCards.some(c => c.index === 0) ? index : i,
      name: name || `Card ${i + 1}`,
      imageUrl,
      keywords: ['Custom Draw', 'Intuitive Wisdom'],
      meaningUpright: `Intuitive contemplation for ${name || `Card ${i + 1}`}. Listen to what the visual archetype brings to consciousness today.`,
      meaningReversed: `Shadow aspect or internalized contemplation for ${name || `Card ${i + 1}`}. Explore subtle subconscious prompts.`,
      deckType: 'custom'
    });
  }

  // Sort cards by index ascending
  parsedCards.sort((a, b) => a.index - b.index);

  // If duplicate indices exist, re-sequence safely
  const seenIndices = new Set<number>();
  parsedCards.forEach((card, idx) => {
    if (seenIndices.has(card.index)) {
      card.index = idx;
    } else {
      seenIndices.add(card.index);
    }
  });

  const deckId = `custom-deck-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const deck: Deck = {
    id: deckId,
    name: deckName,
    description: `User-imported deck containing ${parsedCards.length} custom cards.`,
    cardCount: parsedCards.length,
    isCustom: true,
    cards: parsedCards,
    accentColor: '#e0a96d'
  };

  saveCustomDeckToStorage(deck);

  return {
    deck,
    cardCount: parsedCards.length,
    unparsedFiles
  };
}

const OLD_STORAGE_KEY = 'pocket_oracle_custom_decks';
const STORAGE_KEY = 'pocket_mystic_custom_decks';

export function saveCustomDeckToStorage(deck: Deck): void {
  try {
    const existing = getSavedCustomDecks();
    const updated = [deck, ...existing.filter(d => d.id !== deck.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save custom deck to localStorage (quota exceeded or disabled):', err);
  }
}

export function getSavedCustomDecks(): Deck[] {
  try {
    let data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldData) {
        data = oldData;
        localStorage.setItem(STORAGE_KEY, oldData);
      }
    }
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function deleteCustomDeckFromStorage(deckId: string): void {
  try {
    const existing = getSavedCustomDecks();
    const updated = existing.filter(d => d.id !== deckId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

/**
 * Creates and downloads a sample ZIP archive so the user can immediately test
 * the .zip deck importer feature!
 */
export async function generateAndDownloadSampleDeckZip(): Promise<Blob> {
  const zip = new JSZip();

  // Create 4 sample cards with standardized naming formats to demonstrate parser robustness
  const sampleCards = [
    { filename: '00_the_fool.svg', title: 'The Seeker', number: '0', symbol: '✦', color: '#c5a059' },
    { filename: '01-the-alchemist.svg', title: 'The Alchemist', number: 'I', symbol: '☿', color: '#e0a96d' },
    { filename: '02_high_seer.svg', title: 'High Seer', number: 'II', symbol: '☾', color: '#8fa3b0' },
    { filename: '3.svg', title: 'Sacred Grove', number: 'III', symbol: '❀', color: '#78b584' }
  ];

  sampleCards.forEach(card => {
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 520" width="100%" height="100%">
  <rect width="320" height="520" rx="14" fill="#141414" />
  <rect x="12" y="12" width="296" height="496" rx="10" fill="none" stroke="${card.color}" stroke-width="1.5" />
  <rect x="20" y="20" width="280" height="480" rx="6" fill="none" stroke="${card.color}" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.6" />
  <text x="160" y="55" fill="${card.color}" font-family="monospace" font-size="16" font-weight="bold" text-anchor="middle">${card.number}</text>
  <circle cx="160" cy="240" r="85" fill="none" stroke="${card.color}" stroke-width="1" opacity="0.4" />
  <text x="160" y="265" font-size="75" text-anchor="middle" fill="${card.color}">${card.symbol}</text>
  <text x="160" y="445" fill="#f5f5f5" font-family="serif" font-size="18" font-weight="bold" text-anchor="middle">${card.title.toUpperCase()}</text>
  <text x="160" y="472" fill="${card.color}" font-family="monospace" font-size="10" text-anchor="middle" opacity="0.7">SAMPLE IMPORT DECK</text>
</svg>`.trim();
    zip.file(card.filename, svgContent);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}
