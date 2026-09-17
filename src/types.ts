export interface ParsedCard {
  index: number;
  name: string;
  imageUrl: string;
  keywords: string[];
  meaningUpright: string;
  meaningReversed?: string;
  element?: string;
  symbol?: string;
  deckType: 'tarot' | 'runes' | 'iching' | 'custom';
  arcana?: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  cardCount: number;
  isCustom: boolean;
  cards: ParsedCard[];
  backPattern?: string;
  accentColor?: string;
}

export interface DrawState {
  activeDeckId: string;
  currentCard: ParsedCard | null;
  isFlipped: boolean;
  isReversed: boolean;
  isShuffling: boolean;
  shuffleCount: number;
  drawnAt: number | null;
  hasSavedCurrentDraw?: boolean;
}

export interface JournalEntry {
  id: string;
  cardIndex: number;
  cardName: string;
  deckName: string;
  deckType: string;
  isReversed: boolean;
  timestamp: number;
  notes: string;
  mood?: string;
  tags: string[];
  cardImageUrl: string;
}

export type HapticMode = 'click' | 'double' | 'heavy' | 'soft' | 'off';

export interface SensorStatus {
  supported: boolean;
  active: boolean;
  permissionGranted: boolean;
  lastShakeTime: number;
  magnitude: number;
}

export interface KotlinFile {
  fileName: string;
  packagePath: string;
  description: string;
  code: string;
  category: 'engine' | 'sensor' | 'viewmodel' | 'ui' | 'storage' | 'config';
}
