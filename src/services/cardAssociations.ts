/**
 * Card Associations Service
 * Manages common word associations and keywords for each card,
 * with full support for adding, removing, and persisting user customizations.
 */

const OLD_STORAGE_KEY = 'pocket_oracle_card_associations';
const STORAGE_KEY = 'pocket_mystic_card_associations';

// Curated pool of archetype-specific suggested word associations
const SUGGESTIONS_BY_ARCHETYPE: Record<string, string[]> = {
  // Tarot
  fool: ['New Chapter', 'Adventure', 'Risk', 'Open Mind', 'Trust', 'Clean Slate', 'Curiosity'],
  magician: ['Concentration', 'Action', 'Willpower', 'Creativity', 'Focus', 'Drive', 'Alchemy'],
  highpriestess: ['Silence', 'Intuition', 'Secrets', 'Dreamwork', 'Inner Voice', 'Subconscious', 'Mystery'],
  empress: ['Fertility', 'Abundance', 'Nature', 'Sensuality', 'Growth', 'Nurturing', 'Beauty'],
  emperor: ['Structure', 'Discipline', 'Order', 'Stability', 'Leadership', 'Boundaries', 'Execution'],
  hierophant: ['Tradition', 'Spiritual Study', 'Ethics', 'Mentorship', 'Belief', 'Guidance', 'Wisdom'],
  lovers: ['Soulmate', 'Choice', 'Harmony', 'Duality', 'Commitment', 'Values', 'Union'],
  chariot: ['Triumph', 'Focus', 'Determination', 'Momentum', 'Mastery', 'Discipline', 'Drive'],
  strength: ['Gentle Force', 'Courage', 'Patience', 'Endurance', 'Compassion', 'Resilience', 'Calm'],
  hermit: ['Solitude', 'Introspection', 'Lantern', 'Soul Searching', 'Wisdom', 'Retreat', 'Truth'],
  wheeloffortune: ['Karma', 'Destiny', 'Cycle', 'Shift', 'Change', 'Luck', 'Evolution'],
  justice: ['Honesty', 'Equilibrium', 'Truth', 'Fairness', 'Cause & Effect', 'Clarity', 'Law'],
  hangedman: ['Surrender', 'New Angle', 'Pause', 'Sacrifice', 'Perspective', 'Letting Go', 'Waiting'],
  death: ['End of Era', 'Rebirth', 'Metamorphosis', 'Release', 'Transition', 'Renewal', 'Closure'],
  temperance: ['Harmony', 'Moderation', 'Patience', 'Alchemy', 'Balance', 'Middle Path', 'Integration'],
  devil: ['Attachment', 'Shadow Self', 'Illusion', 'Temptation', 'Materialism', 'Compulsion', 'Breaking Free'],
  tower: ['Awakening', 'Breakthrough', 'Sudden Shift', 'Truth', 'Ego Death', 'Liberation', 'Foundation'],
  star: ['Hope', 'Inspiration', 'Healing', 'Serenity', 'Guiding Light', 'Faith', 'Optimism'],
  moon: ['Dreams', 'Illusion', 'Unconscious', 'Anxiety', 'Hidden Truths', 'Nocturnal', 'Intuition'],
  sun: ['Joy', 'Vitality', 'Clarity', 'Success', 'Warmth', 'Radiance', 'Celebration'],
  judgement: ['Awakening', 'Reckoning', 'Higher Purpose', 'Absolution', 'Calling', 'Redemption', 'Renewal'],
  world: ['Completion', 'Wholeness', 'Success', 'Culmination', 'Integration', 'Cosmic Peace', 'Fulfillment'],

  // Runes
  fehu: ['Wealth', 'Energy', 'Abundance', 'Prosperity', 'New Venture', 'Circulation'],
  uruz: ['Raw Power', 'Vitality', 'Healing', 'Endurance', 'Wild Energy', 'Strength'],
  thurisaz: ['Defense', 'Thorn', 'Protection', 'Gate', 'Breakthrough', 'Conflict'],
  ansuz: ['Divine Word', 'Inspiration', 'Wisdom', 'Voice', 'Message', 'Eloquence'],
  raidho: ['Journey', 'Order', 'Rhythm', 'Travel', 'Alignment', 'Right Path'],
  kenaz: ['Torch', 'Knowledge', 'Insight', 'Craft', 'Spark', 'Illumination'],
  gebo: ['Sacred Gift', 'Partnership', 'Reciprocity', 'Exchange', 'Honor', 'Balance'],
  wunjo: ['Delight', 'Harmony', 'Fellowship', 'Fulfillment', 'Contentment', 'Peace'],
  hagalaz: ['Hail', 'Disruption', 'Transformation', 'Crisis', 'Radical Shift', 'Clean Slate'],
  nauthiz: ['Necessity', 'Friction', 'Constraint', 'Endurance', 'Survival', 'Patience'],
  isa: ['Ice', 'Stillness', 'Freeze', 'Quiet', 'Holding Pattern', 'Patience'],
  jera: ['Harvest', 'Fruitful Cycle', 'Reward', 'Patience', 'Time', 'Right Season'],

  // I Ching
  qian: ['Pure Yang', 'Strength', 'Perseverance', 'Cosmic Energy', 'Initiative', 'Leadership'],
  kun: ['Pure Yin', 'Devotion', 'Receptivity', 'Nourishment', 'Patience', 'Gentle Support'],
  tai: ['Peace', 'Harmony', 'Prosperity', 'Flow', 'Golden Hour', 'Union'],
  fu: ['Return', 'Turning Point', 'Solstice', 'Light Recovers', 'Restoration', 'Gentle Step'],
  kan: ['Abyss', 'Deep Waters', 'Peril', 'Fluidity', 'Sincerity', 'Courage in Darkness'],
  li: ['Clinging Fire', 'Brightness', 'Clarity', 'Illumination', 'Fuel for Purpose', 'Perception']
};

const GENERAL_SUGGESTIONS: string[] = [
  'Focus', 'Courage', 'Patience', 'Release', 'Insight', 'Surrender', 
  'Clarity', 'Alignment', 'Rest', 'Growth', 'Protection', 'Gratitude'
];

function getStorageMap(): Record<string, string[]> {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldRaw) {
        raw = oldRaw;
        localStorage.setItem(STORAGE_KEY, oldRaw);
      }
    }
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function setStorageMap(map: Record<string, string[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Failed to persist card associations:', err);
  }
}

function makeCardKey(deckId: string, cardIndex: number, cardName: string): string {
  // Normalize key
  const safeName = cardName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${deckId}::${cardIndex}::${safeName}`;
}

/**
 * Retrieves the current associations for a card, merging with user custom additions/removals
 */
export function getCardAssociations(
  deckId: string,
  cardIndex: number,
  cardName: string,
  defaultKeywords: string[] = []
): string[] {
  const map = getStorageMap();
  const key = makeCardKey(deckId, cardIndex, cardName);

  if (key in map) {
    return map[key];
  }

  return [...defaultKeywords];
}

/**
 * Adds a new word association to a card
 */
export function addCardAssociation(
  deckId: string,
  cardIndex: number,
  cardName: string,
  wordToAdd: string,
  defaultKeywords: string[] = []
): string[] {
  const trimmed = wordToAdd.trim();
  if (!trimmed) return getCardAssociations(deckId, cardIndex, cardName, defaultKeywords);

  const current = getCardAssociations(deckId, cardIndex, cardName, defaultKeywords);
  
  // Case-insensitive check
  const exists = current.some((w) => w.toLowerCase() === trimmed.toLowerCase());
  if (exists) return current;

  // Capitalize word neatly
  const formattedWord = trimmed
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const updated = [...current, formattedWord];
  const map = getStorageMap();
  const key = makeCardKey(deckId, cardIndex, cardName);
  map[key] = updated;
  setStorageMap(map);

  return updated;
}

/**
 * Removes a word association from a card
 */
export function removeCardAssociation(
  deckId: string,
  cardIndex: number,
  cardName: string,
  wordToRemove: string,
  defaultKeywords: string[] = []
): string[] {
  const current = getCardAssociations(deckId, cardIndex, cardName, defaultKeywords);
  const updated = current.filter(
    (w) => w.toLowerCase() !== wordToRemove.trim().toLowerCase()
  );

  const map = getStorageMap();
  const key = makeCardKey(deckId, cardIndex, cardName);
  map[key] = updated;
  setStorageMap(map);

  return updated;
}

/**
 * Resets a card's associations back to default
 */
export function resetCardAssociations(
  deckId: string,
  cardIndex: number,
  cardName: string,
  defaultKeywords: string[] = []
): string[] {
  const map = getStorageMap();
  const key = makeCardKey(deckId, cardIndex, cardName);
  delete map[key];
  setStorageMap(map);

  return [...defaultKeywords];
}

/**
 * Returns contextual suggestions for a card to easily 1-click add
 */
export function getSuggestionsForCard(
  cardName: string,
  currentWords: string[] = []
): string[] {
  const cleanName = cardName.toLowerCase().replace(/[^a-z]/g, '');
  
  let pool = GENERAL_SUGGESTIONS;
  for (const [key, suggestions] of Object.entries(SUGGESTIONS_BY_ARCHETYPE)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      pool = suggestions;
      break;
    }
  }

  const currentLower = new Set(currentWords.map((w) => w.toLowerCase()));
  return pool.filter((w) => !currentLower.has(w.toLowerCase())).slice(0, 6);
}
