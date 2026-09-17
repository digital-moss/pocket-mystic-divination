import { Deck, ParsedCard } from '../types';
import { TAROT_MINOR_ARCANA } from './tarotMinorArcana';

// Helper to generate artistic SVG card data URIs with rich symbolism
export function createTarotCardSvg(
  numberStr: string,
  title: string,
  primarySymbol: string,
  accentColor: string = '#c5a059',
  subSymbol: string = '✧'
): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 520" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#181716" />
      <stop offset="50%" stop-color="#121212" />
      <stop offset="100%" stop-color="#0a0a09" />
    </linearGradient>
    <pattern id="dotPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="0.8" fill="${accentColor}" opacity="0.15" />
    </pattern>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="320" height="520" rx="14" fill="url(#bgGrad)" />
  <rect width="320" height="520" rx="14" fill="url(#dotPattern)" />

  <!-- Outer Double Borders -->
  <rect x="10" y="10" width="300" height="500" rx="10" fill="none" stroke="${accentColor}" stroke-width="1.2" opacity="0.5" />
  <rect x="16" y="16" width="288" height="488" rx="8" fill="none" stroke="${accentColor}" stroke-width="0.8" opacity="0.85" stroke-dasharray="8 4" />

  <!-- Corner Sacred Glyphs -->
  <text x="24" y="32" fill="${accentColor}" font-family="serif" font-size="12" opacity="0.7">✦</text>
  <text x="296" y="32" fill="${accentColor}" font-family="serif" font-size="12" text-anchor="end" opacity="0.7">✦</text>
  <text x="24" y="496" fill="${accentColor}" font-family="serif" font-size="12" opacity="0.7">✦</text>
  <text x="296" y="496" fill="${accentColor}" font-family="serif" font-size="12" text-anchor="end" opacity="0.7">✦</text>

  <!-- Top Roman Numeral Header -->
  <text x="160" y="52" fill="${accentColor}" font-family="Cinzel, Georgia, serif" font-size="16" font-weight="700" letter-spacing="4" text-anchor="middle">
    ${numberStr}
  </text>
  <line x1="80" y1="62" x2="240" y2="62" stroke="${accentColor}" stroke-width="0.75" opacity="0.5" />
  <circle cx="160" cy="62" r="2.5" fill="${accentColor}" />

  <!-- Central Mystical Frame -->
  <rect x="36" y="80" width="248" height="320" rx="6" fill="#141312" stroke="${accentColor}" stroke-width="0.8" opacity="0.9" />
  <circle cx="160" cy="240" r="95" fill="none" stroke="${accentColor}" stroke-width="0.6" opacity="0.25" />
  <circle cx="160" cy="240" r="110" fill="none" stroke="${accentColor}" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.35" />
  <polygon points="160,148 240,286 80,286" fill="none" stroke="${accentColor}" stroke-width="0.6" opacity="0.2" />
  <polygon points="160,332 240,194 80,194" fill="none" stroke="${accentColor}" stroke-width="0.6" opacity="0.2" />

  <!-- Central Symbol Art -->
  <g filter="url(#glow)">
    <text x="160" y="258" font-family="'Cinzel', serif, sans-serif" font-size="78" text-anchor="middle" fill="${accentColor}" opacity="0.95">
      ${primarySymbol}
    </text>
  </g>

  <!-- Small Sub Symbol & Rays -->
  <text x="160" y="128" fill="${accentColor}" font-size="15" text-anchor="middle" opacity="0.8">${subSymbol}</text>
  <text x="160" y="365" fill="${accentColor}" font-size="13" text-anchor="middle" opacity="0.6">✧ ✦ ✧</text>

  <!-- Bottom Card Title -->
  <line x1="60" y1="430" x2="260" y2="430" stroke="${accentColor}" stroke-width="0.75" opacity="0.5" />
  <text x="160" y="458" fill="#f4ede0" font-family="Cinzel, Georgia, serif" font-size="15" font-weight="600" letter-spacing="2" text-anchor="middle">
    ${title.toUpperCase()}
  </text>
  <text x="160" y="478" fill="${accentColor}" font-family="monospace" font-size="9" letter-spacing="3" text-anchor="middle" opacity="0.65">
    POCKET MYSTIC
  </text>
</svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createRuneCardSvg(
  numberStr: string,
  name: string,
  glyph: string,
  phonetic: string
): string {
  const accent = '#8fa3b0';
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 520" width="100%" height="100%">
  <rect width="320" height="520" rx="14" fill="#0f1112" />
  <rect x="14" y="14" width="292" height="492" rx="8" fill="none" stroke="${accent}" stroke-width="1" opacity="0.6" />
  <rect x="20" y="20" width="280" height="480" rx="6" fill="none" stroke="${accent}" stroke-width="0.5" stroke-dasharray="6 3" opacity="0.4" />

  <text x="160" y="55" fill="${accent}" font-family="monospace" font-size="13" letter-spacing="4" text-anchor="middle" opacity="0.85">
    AETT ${numberStr}
  </text>
  <line x1="90" y1="68" x2="230" y2="68" stroke="${accent}" stroke-width="0.7" opacity="0.4" />

  <!-- Rune Stone Center -->
  <path d="M 80 140 Q 160 110 240 140 Q 260 250 240 360 Q 160 390 80 360 Q 60 250 80 140 Z" fill="#15181b" stroke="${accent}" stroke-width="1" opacity="0.8" />

  <text x="160" y="270" fill="#e8edf2" font-family="'Cinzel', 'Noto Sans', sans-serif" font-size="96" font-weight="700" text-anchor="middle">
    ${glyph}
  </text>

  <text x="160" y="440" fill="#f0f4f8" font-family="Cinzel, Georgia, serif" font-size="18" font-weight="700" letter-spacing="3" text-anchor="middle">
    ${name.toUpperCase()}
  </text>
  <text x="160" y="465" fill="${accent}" font-family="monospace" font-size="11" letter-spacing="2" text-anchor="middle" opacity="0.75">
    SOUND: ${phonetic}
  </text>
</svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createIChingCardSvg(
  hexNum: number,
  title: string,
  trigrams: string,
  binaryLines: boolean[] // 6 lines from top to bottom
): string {
  const accent = '#bca07e';
  // Generate 6 lines for hexagram
  let lineElements = '';
  binaryLines.forEach((isYang, index) => {
    const y = 180 + index * 26;
    if (isYang) {
      // Solid unbroken Yang line
      lineElements += `<rect x="95" y="${y}" width="130" height="12" rx="3" fill="#eae1d2" />`;
    } else {
      // Broken Yin line
      lineElements += `<rect x="95" y="${y}" width="58" height="12" rx="3" fill="#eae1d2" /><rect x="167" y="${y}" width="58" height="12" rx="3" fill="#eae1d2" />`;
    }
  });

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 520" width="100%" height="100%">
  <rect width="320" height="520" rx="14" fill="#131211" />
  <rect x="14" y="14" width="292" height="492" rx="8" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.6" />
  <rect x="22" y="22" width="276" height="476" rx="6" fill="none" stroke="${accent}" stroke-width="0.6" opacity="0.3" />

  <text x="160" y="58" fill="${accent}" font-family="monospace" font-size="14" letter-spacing="4" text-anchor="middle">
    HEXAGRAM #${hexNum}
  </text>
  <line x1="80" y1="72" x2="240" y2="72" stroke="${accent}" stroke-width="0.8" opacity="0.5" />

  <!-- Yin Yang Circle background watermark -->
  <circle cx="160" cy="245" r="95" fill="none" stroke="${accent}" stroke-width="0.6" opacity="0.2" />

  <!-- 6 Hexagram Lines -->
  <g>
    ${lineElements}
  </g>

  <text x="160" y="380" fill="${accent}" font-family="monospace" font-size="11" letter-spacing="2" text-anchor="middle" opacity="0.85">
    ${trigrams}
  </text>

  <line x1="70" y1="420" x2="250" y2="420" stroke="${accent}" stroke-width="0.75" opacity="0.4" />
  <text x="160" y="450" fill="#fbf8f2" font-family="Cinzel, Georgia, serif" font-size="17" font-weight="700" letter-spacing="2" text-anchor="middle">
    ${title.toUpperCase()}
  </text>
  <text x="160" y="475" fill="${accent}" font-family="monospace" font-size="10" letter-spacing="2" text-anchor="middle" opacity="0.7">
    BOOK OF CHANGES
  </text>
</svg>
  `.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const TAROT_MAJOR_ARCANA: ParsedCard[] = [
  {
    index: 0,
    name: 'The Fool',
    imageUrl: createTarotCardSvg('0', 'The Fool', '☼', '#e6a147', '☽'),
    keywords: ['Beginnings', 'Innocence', 'Spontaneity', 'Free Spirit', 'Leap of Faith'],
    meaningUpright: 'A fresh new journey full of potential. Step out into the unknown with faith, curiosity, and an open heart.',
    meaningReversed: 'Recklessness, fear of taking calculated chances, holding back out of doubt or naive misjudgment.',
    element: 'Air',
    symbol: '☼',
    deckType: 'tarot'
  },
  {
    index: 1,
    name: 'The Magician',
    imageUrl: createTarotCardSvg('I', 'The Magician', '∞', '#d4af37', '☿'),
    keywords: ['Manifestation', 'Resourcefulness', 'Power', 'Inspired Action', 'Skill'],
    meaningUpright: 'You possess all tools and resources required to turn ideas into reality. Direct your focus with clarity.',
    meaningReversed: 'Misdirected talents, manipulation, illusions, untapped potential or wasted energy.',
    element: 'Air / Mercury',
    symbol: '∞',
    deckType: 'tarot'
  },
  {
    index: 2,
    name: 'The High Priestess',
    imageUrl: createTarotCardSvg('II', 'The High Priestess', '☽', '#9ca3af', '☾'),
    keywords: ['Intuition', 'Sacred Knowledge', 'Divine Feminine', 'Subconscious', 'Mystery'],
    meaningUpright: 'Trust your inner voice and quiet instincts. Secrets and profound truths dwell beneath the surface of daily noise.',
    meaningReversed: 'Ignoring gut feelings, superficiality, gossip, disconnect from inner wisdom.',
    element: 'Water / Moon',
    symbol: '☽',
    deckType: 'tarot'
  },
  {
    index: 3,
    name: 'The Empress',
    imageUrl: createTarotCardSvg('III', 'The Empress', '♀', '#78b584', '❀'),
    keywords: ['Abundance', 'Nurturing', 'Fertility', 'Sensuality', 'Creativity'],
    meaningUpright: 'A period of rich growth, sensory beauty, and flourishing creative abundance. Embrace life’s nourishing gifts.',
    meaningReversed: 'Creative blockages, dependency, smothering tendencies, neglecting self-care.',
    element: 'Earth / Venus',
    symbol: '♀',
    deckType: 'tarot'
  },
  {
    index: 4,
    name: 'The Emperor',
    imageUrl: createTarotCardSvg('IV', 'The Emperor', '♈', '#c95147', '♔'),
    keywords: ['Authority', 'Structure', 'Stability', 'Leadership', 'Father Figure'],
    meaningUpright: 'Order, firm discipline, and strategic grounding will establish long-term foundation and protect what matters.',
    meaningReversed: 'Rigid tyranny, lack of control, chaotic disorganization, stubborn obstinance.',
    element: 'Fire / Aries',
    symbol: '♈',
    deckType: 'tarot'
  },
  {
    index: 5,
    name: 'The Hierophant',
    imageUrl: createTarotCardSvg('V', 'The Hierophant', '☩', '#d4a373', '🗝'),
    keywords: ['Spiritual Wisdom', 'Tradition', 'Guidance', 'Mentorship', 'Conformity'],
    meaningUpright: 'Look to established traditions, wise elders, and time-tested practices for grounding clarity.',
    meaningReversed: 'Challenging outdated dogmas, personal belief systems, unconventional paths, rigid orthodoxy.',
    element: 'Earth / Taurus',
    symbol: '☩',
    deckType: 'tarot'
  },
  {
    index: 6,
    name: 'The Lovers',
    imageUrl: createTarotCardSvg('VI', 'The Lovers', '♡', '#e879a9', '♊'),
    keywords: ['Love', 'Harmony', 'Alignment', 'Moral Choices', 'Values'],
    meaningUpright: 'Soul connection, union of opposites, and crucial decisions guided by personal values and integrity.',
    meaningReversed: 'Misalignment of values, conflict, indecision, fear of commitment.',
    element: 'Air / Gemini',
    symbol: '♡',
    deckType: 'tarot'
  },
  {
    index: 7,
    name: 'The Chariot',
    imageUrl: createTarotCardSvg('VII', 'The Chariot', '⚔', '#60a5fa', '♋'),
    keywords: ['Determination', 'Willpower', 'Victory', 'Drive', 'Self-Mastery'],
    meaningUpright: 'Harness conflicting inner drives through intense willpower. Clear victory comes through focused discipline.',
    meaningReversed: 'Loss of control, directionless aggression, obstacles halting momentum.',
    element: 'Water / Cancer',
    symbol: '⚔',
    deckType: 'tarot'
  },
  {
    index: 8,
    name: 'Strength',
    imageUrl: createTarotCardSvg('VIII', 'Strength', '♌', '#f59e0b', '🦁'),
    keywords: ['Courage', 'Compassion', 'Patience', 'Gentle Power', 'Endurance'],
    meaningUpright: 'True power is soft and patient. Calming beasts through empathy, inner resilience, and steadfast grace.',
    meaningReversed: 'Self-doubt, raw vulnerability, weakness, giving in to base impulses.',
    element: 'Fire / Leo',
    symbol: '♌',
    deckType: 'tarot'
  },
  {
    index: 9,
    name: 'The Hermit',
    imageUrl: createTarotCardSvg('IX', 'The Hermit', ' lantern ', '#94a3b8', '♍'),
    keywords: ['Soul-Searching', 'Solitude', 'Inner Light', 'Reflection', 'Contemplation'],
    meaningUpright: 'Withdraw from outer clamor into quiet solitude. Your own lantern will illuminate the next step forward.',
    meaningReversed: 'Isolation, loneliness, anti-social withdrawal, refusing needed guidance.',
    element: 'Earth / Virgo',
    symbol: '🏮',
    deckType: 'tarot'
  },
  {
    index: 10,
    name: 'Wheel of Fortune',
    imageUrl: createTarotCardSvg('X', 'Wheel of Fortune', '☸', '#10b981', '♃'),
    keywords: ['Cycles', 'Karma', 'Destiny', 'Turning Point', 'Opportunity'],
    meaningUpright: 'The inevitable turn of cosmic cycles. What was low will rise; seize sudden shifts with grace.',
    meaningReversed: 'Unwelcome turn of luck, resisting change, breaking repetitive cycles.',
    element: 'Fire / Jupiter',
    symbol: '☸',
    deckType: 'tarot'
  },
  {
    index: 11,
    name: 'Justice',
    imageUrl: createTarotCardSvg('XI', 'Justice', '⚖', '#38bdf8', '♎'),
    keywords: ['Fairness', 'Truth', 'Cause and Effect', 'Clarity', 'Integrity'],
    meaningUpright: 'Equitable resolution, radical honesty, and accountability. Universal law balances all scales.',
    meaningReversed: 'Dishonesty, unfair treatment, bias, avoiding responsibility.',
    element: 'Air / Libra',
    symbol: '⚖',
    deckType: 'tarot'
  },
  {
    index: 12,
    name: 'The Hanged Man',
    imageUrl: createTarotCardSvg('XII', 'The Hanged Man', '☿', '#818cf8', '♆'),
    keywords: ['Surrender', 'New Perspective', 'Suspension', 'Letting Go', 'Pause'],
    meaningUpright: 'Willful surrender and sacrifice. By seeing the world upside down, illumination arrives.',
    meaningReversed: 'Stalling, needless sacrifice, martyrdom, resistance to inevitable surrender.',
    element: 'Water / Neptune',
    symbol: '⚓',
    deckType: 'tarot'
  },
  {
    index: 13,
    name: 'Death',
    imageUrl: createTarotCardSvg('XIII', 'Death', '☠', '#a855f7', '♏'),
    keywords: ['Transformation', 'Endings', 'Metamorphosis', 'Transitions', 'Renewal'],
    meaningUpright: 'The graceful closing of an outdated chapter. Clear away the old wood so fresh shoots can emerge.',
    meaningReversed: 'Fear of change, lingering in decayed situations, decay without rebirth.',
    element: 'Water / Scorpio',
    symbol: '☠',
    deckType: 'tarot'
  },
  {
    index: 14,
    name: 'Temperance',
    imageUrl: createTarotCardSvg('XIV', 'Temperance', '⚗', '#34d399', '♐'),
    keywords: ['Balance', 'Moderation', 'Alchemy', 'Patience', 'Purpose'],
    meaningUpright: 'Blending opposites in harmonious measure. Calm patience alchemizes raw ingredients into gold.',
    meaningReversed: 'Imbalance, extremes, impatience, discord, reckless indulgence.',
    element: 'Fire / Sagittarius',
    symbol: '⚗',
    deckType: 'tarot'
  },
  {
    index: 15,
    name: 'The Devil',
    imageUrl: createTarotCardSvg('XV', 'The Devil', '⛧', '#ef4444', '♑'),
    keywords: ['Shadow Self', 'Bondage', 'Attachment', 'Illusion', 'Materialism'],
    meaningUpright: 'Chains of your own making. Face unhealthy habits, obsessions, and illusions with courageous scrutiny.',
    meaningReversed: 'Breaking free from entrapment, detachment from toxic cycles, reclaiming autonomy.',
    element: 'Earth / Capricorn',
    symbol: '⛧',
    deckType: 'tarot'
  },
  {
    index: 16,
    name: 'The Tower',
    imageUrl: createTarotCardSvg('XVI', 'The Tower', '⚡', '#f97316', '♂'),
    keywords: ['Sudden Awakening', 'Upheaval', 'Breakthrough', 'Truth', 'Revelation'],
    meaningUpright: 'Lightning strikes false foundations. Painful yet liberating dismantling of ego and illusion.',
    meaningReversed: 'Disaster narrowly averted, delaying inevitable upheaval, fear of collapse.',
    element: 'Fire / Mars',
    symbol: '⚡',
    deckType: 'tarot'
  },
  {
    index: 17,
    name: 'The Star',
    imageUrl: createTarotCardSvg('XVII', 'The Star', '★', '#38bdf8', '♒'),
    keywords: ['Hope', 'Inspiration', 'Serenity', 'Faith', 'Blessings'],
    meaningUpright: 'Clear skies after the storm. Renewed faith, tranquil peace, and luminous divine inspiration.',
    meaningReversed: 'Hopelessness, pessimism, despair, feeling uninspired or depleted.',
    element: 'Air / Aquarius',
    symbol: '★',
    deckType: 'tarot'
  },
  {
    index: 18,
    name: 'The Moon',
    imageUrl: createTarotCardSvg('XVIII', 'The Moon', '☽', '#93c5fd', '♓'),
    keywords: ['Illusion', 'Dreams', 'Unconscious', 'Anxiety', 'Hidden Realms'],
    meaningUpright: 'Walking through nocturnal fog. Shadows deceive the eye; tune your intuition through dreams.',
    meaningReversed: 'Unveiling deception, clarity piercing illusion, overcoming unfounded anxieties.',
    element: 'Water / Pisces',
    symbol: '☽',
    deckType: 'tarot'
  },
  {
    index: 19,
    name: 'The Sun',
    imageUrl: createTarotCardSvg('XIX', 'The Sun', '☼', '#eab308', '☉'),
    keywords: ['Joy', 'Vitality', 'Warmth', 'Radiance', 'Success'],
    meaningUpright: 'Unbridled light, vitality, happiness, and clear truth. Everything you touch blossoms in warmth.',
    meaningReversed: 'Temporary gloom, clouded optimism, excessive pride or burnout.',
    element: 'Fire / Sun',
    symbol: '☼',
    deckType: 'tarot'
  },
  {
    index: 20,
    name: 'Judgement',
    imageUrl: createTarotCardSvg('XX', 'Judgement', '🕪', '#a78bfa', '♇'),
    keywords: ['Rebirth', 'Higher Calling', 'Absolution', 'Awakening', 'Clarity'],
    meaningUpright: 'Hearing the horn of your higher purpose. Forgive the past, rise renewed, and step into alignment.',
    meaningReversed: 'Harsh self-criticism, ignoring inner calling, regret, avoidance of truth.',
    element: 'Fire / Pluto',
    symbol: '🕪',
    deckType: 'tarot'
  },
  {
    index: 21,
    name: 'The World',
    imageUrl: createTarotCardSvg('XXI', 'The World', '🜛', '#2dd4bf', '♄'),
    keywords: ['Completion', 'Wholeness', 'Integration', 'Achievement', 'Cosmic Harmony'],
    meaningUpright: 'The circle completes in triumphant harmony. Mastery, total integration, and graduation to higher cycles.',
    meaningReversed: 'Unfinished business, lack of closure, lingering loose ends.',
    element: 'Earth / Saturn',
    symbol: '🜛',
    deckType: 'tarot'
  }
];

export const ELDER_FUTHARK_RUNES: ParsedCard[] = [
  {
    index: 0,
    name: 'Fehu',
    imageUrl: createRuneCardSvg('I', 'Fehu', 'ᚠ', 'F'),
    keywords: ['Wealth', 'Cattle', 'Abundance', 'New Beginnings', 'Vitality'],
    meaningUpright: 'Earned prosperity, financial vitality, and creative spark. Circulate resources generously.',
    meaningReversed: 'Loss of property, financial stress, hoarded stagnation, greed.',
    element: 'Fire / Earth',
    symbol: 'ᚠ',
    deckType: 'runes'
  },
  {
    index: 1,
    name: 'Uruz',
    imageUrl: createRuneCardSvg('I', 'Uruz', 'ᚢ', 'U'),
    keywords: ['Aurochs', 'Wild Strength', 'Health', 'Primal Energy', 'Courage'],
    meaningUpright: 'Untamed raw power, physical fortitude, and healing. Harness primal stamina.',
    meaningReversed: 'Misdirected brute force, illness, depleted vigor, sudden violence.',
    element: 'Earth',
    symbol: 'ᚢ',
    deckType: 'runes'
  },
  {
    index: 2,
    name: 'Thurisaz',
    imageUrl: createRuneCardSvg('I', 'Thurisaz', 'ᚦ', 'TH'),
    keywords: ['Giant / Thorn', 'Protection', 'Conflict', 'Threshold', 'Gateway'],
    meaningUpright: 'Sharp thorn of defense. Stop, meditate, and assess before crossing dangerous thresholds.',
    meaningReversed: 'Danger, betrayal, impulsiveness causing self-harm.',
    element: 'Fire',
    symbol: 'ᚦ',
    deckType: 'runes'
  },
  {
    index: 3,
    name: 'Ansuz',
    imageUrl: createRuneCardSvg('I', 'Ansuz', 'ᚨ', 'A'),
    keywords: ['God Odin', 'Inspiration', 'Wisdom', 'Communication', 'Word'],
    meaningUpright: 'Divine inspiration, eloquent speech, and messages from higher consciousness. Listen carefully.',
    meaningReversed: 'Misinformation, deceit, manipulation, misunderstanding.',
    element: 'Air',
    symbol: 'ᚨ',
    deckType: 'runes'
  },
  {
    index: 4,
    name: 'Raidho',
    imageUrl: createRuneCardSvg('I', 'Raidho', 'ᚱ', 'R'),
    keywords: ['Journey', 'Rhythm', 'Cosmic Law', 'Order', 'Movement'],
    meaningUpright: 'Physical journey or moral alignment. Trust the natural cadence and rhythm of life.',
    meaningReversed: 'Delays, disruption of plans, dislocation, moral confusion.',
    element: 'Air',
    symbol: 'ᚱ',
    deckType: 'runes'
  },
  {
    index: 5,
    name: 'Kenaz',
    imageUrl: createRuneCardSvg('I', 'Kenaz', 'ᚲ', 'K / C'),
    keywords: ['Torch', 'Illumination', 'Craft', 'Insight', 'Passion'],
    meaningUpright: 'The torch illuminates dark corners. Technical mastery, passion, and creative breakthrough.',
    meaningReversed: 'Extinguished flame, darkness, illusion, loss of inspiration.',
    element: 'Fire',
    symbol: 'ᚲ',
    deckType: 'runes'
  },
  {
    index: 6,
    name: 'Gebo',
    imageUrl: createRuneCardSvg('I', 'Gebo', 'ᚷ', 'G'),
    keywords: ['Gift', 'Partnership', 'Reciprocity', 'Exchange', 'Honor'],
    meaningUpright: 'Sacred mutual exchange and honorable alliance. Gifts bind souls in harmonious balance.',
    meaningReversed: 'Gifts with hidden obligations, one-sided parasitism, broken pacts.',
    element: 'Air',
    symbol: 'ᚷ',
    deckType: 'runes'
  },
  {
    index: 7,
    name: 'Wunjo',
    imageUrl: createRuneCardSvg('I', 'Wunjo', 'ᚹ', 'W'),
    keywords: ['Joy', 'Fellowship', 'Fulfillment', 'Harmony', 'Delight'],
    meaningUpright: 'Pure joy, fellowship with kin, and the sweet arrival of fruit after patient labor.',
    meaningReversed: 'Sorrow, discord, alienation, illusion of happiness.',
    element: 'Earth / Air',
    symbol: 'ᚹ',
    deckType: 'runes'
  },
  {
    index: 8,
    name: 'Hagalaz',
    imageUrl: createRuneCardSvg('II', 'Hagalaz', 'ᚺ', 'H'),
    keywords: ['Hail', 'Radical Disruption', 'Trial', 'Crisis', 'Natural Force'],
    meaningUpright: 'Elemental icy hail storm. Uncontrolled destruction clears the ground for essential truth.',
    meaningReversed: 'Painful crisis, disaster, unavoidable natural reckoning.',
    element: 'Ice / Water',
    symbol: 'ᚺ',
    deckType: 'runes'
  },
  {
    index: 9,
    name: 'Nauthiz',
    imageUrl: createRuneCardSvg('II', 'Nauthiz', 'ᚾ', 'N'),
    keywords: ['Need', 'Constraint', 'Friction', 'Endurance', 'Necessity'],
    meaningUpright: 'Necessity is the mother of invention. Endure constraint; friction sparks the survival flame.',
    meaningReversed: 'Deprivation, despair, self-imposed limitation, exhaustion.',
    element: 'Fire / Ice',
    symbol: 'ᚾ',
    deckType: 'runes'
  },
  {
    index: 10,
    name: 'Isa',
    imageUrl: createRuneCardSvg('II', 'Isa', 'ᛁ', 'I'),
    keywords: ['Ice', 'Stillness', 'Freeze', 'Patience', 'Quietude'],
    meaningUpright: 'Absolute stillness. Flow is temporarily frozen into glass. Wait patiently for spring.',
    meaningReversed: 'Cold detachment, emotional freezing, stagnation, numbness.',
    element: 'Ice',
    symbol: 'ᛁ',
    deckType: 'runes'
  },
  {
    index: 11,
    name: 'Jera',
    imageUrl: createRuneCardSvg('II', 'Jera', 'ᛃ', 'J / Y'),
    keywords: ['Harvest', 'Yearly Cycle', 'Fruitful Labor', 'Justice', 'Time'],
    meaningUpright: 'The golden harvest of faithful cultivation. Right actions yield bountiful rewards in their season.',
    meaningReversed: 'Premature harvest, delayed reward, unseasonable impatience.',
    element: 'Earth',
    symbol: 'ᛃ',
    deckType: 'runes'
  }
];

export const I_CHING_HEXAGRAMS: ParsedCard[] = [
  {
    index: 1,
    name: '1. Qian (The Creative)',
    imageUrl: createIChingCardSvg(1, 'The Creative', 'HEAVEN OVER HEAVEN', [true, true, true, true, true, true]),
    keywords: ['Pure Yang', 'Strength', 'Perseverance', 'Cosmic Energy', 'Initiative'],
    meaningUpright: 'Supreme success through unyielding perseverance. Align with celestial law; fly high with humility.',
    meaningReversed: 'Arrogance overreaching its bounds; exhaustion from ceaseless striving without rest.',
    element: 'Metal / Heaven',
    symbol: '☰',
    deckType: 'iching'
  },
  {
    index: 2,
    name: '2. Kun (The Receptive)',
    imageUrl: createIChingCardSvg(2, 'The Receptive', 'EARTH OVER EARTH', [false, false, false, false, false, false]),
    keywords: ['Pure Yin', 'Devotion', 'Nourishment', 'Receptivity', 'Open Vessel'],
    meaningUpright: 'Yielding strength that supports all life. Follow rather than lead; quiet devotion bears fruit.',
    meaningReversed: 'Passive aggression, stagnation, lack of initiative, feeling overwhelmed by burden.',
    element: 'Earth',
    symbol: '☷',
    deckType: 'iching'
  },
  {
    index: 11,
    name: '11. Tai (Peace)',
    imageUrl: createIChingCardSvg(11, 'Peace', 'EARTH OVER HEAVEN', [false, false, false, true, true, true]),
    keywords: ['Harmony', 'Heaven and Earth Meet', 'Flow', 'Flourishing', 'Union'],
    meaningUpright: 'Heaven descends while Earth ascends; heavenly harmony touches the human realm. Golden age.',
    meaningReversed: 'Complacency during good times; failing to guard against future downturn.',
    element: 'Earth & Heaven',
    symbol: '☷ ☰',
    deckType: 'iching'
  },
  {
    index: 24,
    name: '24. Fu (Return)',
    imageUrl: createIChingCardSvg(24, 'Return', 'EARTH OVER THUNDER', [false, false, false, false, false, true]),
    keywords: ['Turning Point', 'Solstice', 'Rebirth of Light', 'Renewal', 'Rest'],
    meaningUpright: 'The light returns from deep winter. Gentle rebirth; do not force rapid motion, nurture the spark.',
    meaningReversed: 'Resisting return, wandering further off track, relapsing into old errors.',
    element: 'Thunder in Earth',
    symbol: '☷ ☳',
    deckType: 'iching'
  },
  {
    index: 29,
    name: '29. Kan (The Abyssal)',
    imageUrl: createIChingCardSvg(29, 'The Abyssal', 'WATER OVER WATER', [false, true, false, false, true, false]),
    keywords: ['Chasm', 'Peril', 'Depth', 'Courage', 'Fluidity'],
    meaningUpright: 'Flow like water through dangerous gorges. Sincerity of heart carries you safely across the abyss.',
    meaningReversed: 'Drowning in fear, panicking in deep waters, reckless plunging into danger.',
    element: 'Water',
    symbol: '☵ ☵',
    deckType: 'iching'
  },
  {
    index: 30,
    name: '30. Li (The Clinging)',
    imageUrl: createIChingCardSvg(30, 'The Clinging', 'FIRE OVER FIRE', [true, false, true, true, false, true]),
    keywords: ['Fire', 'Illumination', 'Clarity', 'Attachment', 'Perseverance'],
    meaningUpright: 'Fire clings to wood; bright clarity illuminates all affairs. Maintain inner purity and care for the fuel.',
    meaningReversed: 'Fierce burn out, fiery anger, clinging to hollow appearances.',
    element: 'Fire',
    symbol: '☲ ☲',
    deckType: 'iching'
  }
];

export const TAROT_FULL_DECK: ParsedCard[] = [
  ...TAROT_MAJOR_ARCANA.map((c) => ({ ...c, arcana: 'major' as const })),
  ...TAROT_MINOR_ARCANA
];

export const INITIAL_DECKS: Deck[] = [
  {
    id: 'tarot-full-deck',
    name: 'Tarot (Both Arcana)',
    description: 'Complete 78-card traditional tarot uniting all 22 Major Arcana archetypes with all 56 Minor Arcana suit cards (Wands, Cups, Swords, Pentacles).',
    cardCount: 78,
    isCustom: false,
    cards: TAROT_FULL_DECK,
    accentColor: '#d4af37'
  },
  {
    id: 'tarot-major-arcana',
    name: 'Tarot (Major Arcana)',
    description: 'The 22 primary archetypes of spiritual evolution, karmic lessons, and universal truth (The Fool to The World).',
    cardCount: TAROT_MAJOR_ARCANA.length,
    isCustom: false,
    cards: TAROT_MAJOR_ARCANA.map((c) => ({ ...c, arcana: 'major' as const })),
    accentColor: '#e6a147'
  },
  {
    id: 'tarot-minor-arcana',
    name: 'Tarot (Minor Arcana)',
    description: 'The 56 elemental everyday cards across the four sacred suits: Wands (Fire), Cups (Water), Swords (Air), and Pentacles (Earth).',
    cardCount: TAROT_MINOR_ARCANA.length,
    isCustom: false,
    cards: TAROT_MINOR_ARCANA,
    accentColor: '#38bdf8'
  },
  {
    id: 'elder-futhark-runes',
    name: 'Elder Futhark Runes',
    description: 'Ancient Norse oracle staves carved with deep elemental wisdom, aettir, and sacred staves.',
    cardCount: ELDER_FUTHARK_RUNES.length,
    isCustom: false,
    cards: ELDER_FUTHARK_RUNES,
    accentColor: '#8fa3b0'
  },
  {
    id: 'iching-book-of-changes',
    name: 'I Ching Hexagrams',
    description: 'The ancient Book of Changes. Trigram balances and philosophical guidance for timely right action.',
    cardCount: I_CHING_HEXAGRAMS.length,
    isCustom: false,
    cards: I_CHING_HEXAGRAMS,
    accentColor: '#bca07e'
  }
];
