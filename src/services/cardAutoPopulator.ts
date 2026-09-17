/**
 * Card Auto-Populator Service
 * Generates rich archetypal metadata, word associations, and divination interpretations
 * for photos taken or uploaded by the user.
 * Supports both fast offline heuristics and optional AI vision analysis.
 */

import { ParsedCard } from '../types';

export interface CardTemplate {
  name: string;
  keywords: string[];
  meaningUpright: string;
  meaningReversed: string;
  element: string;
}

// 22 Major Arcana archetypal templates for classical tarot photo imports
const TAROT_TEMPLATES: CardTemplate[] = [
  {
    name: 'The Fool',
    keywords: ['New Beginnings', 'Innocence', 'Spontaneity', 'Clean Slate', 'Leap of Faith'],
    meaningUpright: 'A fresh chapter begins with unlimited potential. Step forward with trust and an open mind.',
    meaningReversed: 'Recklessness, fear of the unknown, or hesitation before a necessary leap.',
    element: 'Air'
  },
  {
    name: 'The Magician',
    keywords: ['Manifestation', 'Willpower', 'Resourcefulness', 'Focus', 'Alchemy'],
    meaningUpright: 'You possess all the tools, skills, and energy necessary to shape your desired reality.',
    meaningReversed: 'Untapped potential, scattered focus, or illusions obscuring true intention.',
    element: 'Air / Mercury'
  },
  {
    name: 'The High Priestess',
    keywords: ['Intuition', 'Subconscious', 'Mystery', 'Inner Voice', 'Silence'],
    meaningUpright: 'Look beneath the surface. Trust your inner knowing, intuitive dreams, and silent whispers.',
    meaningReversed: 'Ignoring intuition, superficial distractions, or repressed wisdom.',
    element: 'Water / Moon'
  },
  {
    name: 'The Empress',
    keywords: ['Abundance', 'Fertility', 'Nurturing', 'Nature', 'Creativity'],
    meaningUpright: 'Creative energy flows effortlessly. Nurture your ideas and surround yourself with beauty and comfort.',
    meaningReversed: 'Creative block, emotional fatigue, or neglecting your own self-care.',
    element: 'Earth / Venus'
  },
  {
    name: 'The Emperor',
    keywords: ['Authority', 'Structure', 'Discipline', 'Protection', 'Leadership'],
    meaningUpright: 'Establish firm boundaries, structured systems, and steady leadership to bring stability.',
    meaningReversed: 'Rigid inflexibility, micromanagement, or a lack of disciplined direction.',
    element: 'Fire / Aries'
  },
  {
    name: 'The Hierophant',
    keywords: ['Tradition', 'Mentorship', 'Wisdom', 'Spiritual Study', 'Ethics'],
    meaningUpright: 'Seek guidance from trusted lineage, established teachings, or your ethical compass.',
    meaningReversed: 'Questioning dogma, non-conformity, or seeking your own bespoke spiritual path.',
    element: 'Earth / Taurus'
  },
  {
    name: 'The Lovers',
    keywords: ['Harmony', 'Alignment', 'Choices', 'Values', 'Soul Connection'],
    meaningUpright: 'Deep alignment of personal values, mutual respect, and significant decisions from the heart.',
    meaningReversed: 'Disharmony, inner conflict, or values clashing in an important partnership.',
    element: 'Air / Gemini'
  },
  {
    name: 'The Chariot',
    keywords: ['Momentum', 'Determination', 'Focus', 'Triumph', 'Mastery'],
    meaningUpright: 'Channel opposing forces into one unified direction. Forward drive and triumph through discipline.',
    meaningReversed: 'Loss of direction, aggression, or feeling carried away by external momentum.',
    element: 'Water / Cancer'
  },
  {
    name: 'Strength',
    keywords: ['Gentle Power', 'Courage', 'Compassion', 'Patience', 'Endurance'],
    meaningUpright: 'True power comes from gentle persistence, calm endurance, and deep self-compassion.',
    meaningReversed: 'Self-doubt, raw reactivity, or struggling with imposter feelings.',
    element: 'Fire / Leo'
  },
  {
    name: 'The Hermit',
    keywords: ['Solitude', 'Introspection', 'Inner Lantern', 'Guidance', 'Retreat'],
    meaningUpright: 'Withdraw from external chatter. The answers you seek are illuminated in stillness.',
    meaningReversed: 'Isolation, loneliness, or avoiding necessary social connection and community.',
    element: 'Earth / Virgo'
  },
  {
    name: 'Wheel of Fortune',
    keywords: ['Cycles', 'Destiny', 'Karma', 'Turning Point', 'Evolution'],
    meaningUpright: 'A pivotal shift in fortune. Trust that life moves in natural ebb and flow.',
    meaningReversed: 'Resistance to change, bad luck cycles, or clinging to the past.',
    element: 'Fire / Jupiter'
  },
  {
    name: 'Justice',
    keywords: ['Truth', 'Fairness', 'Equilibrium', 'Clarity', 'Cause & Effect'],
    meaningUpright: 'Honesty and balanced perspective will prevail. Own your choices and examine the facts with clarity.',
    meaningReversed: 'Unfair treatment, dishonesty, or avoiding accountability for past actions.',
    element: 'Air / Libra'
  },
  {
    name: 'The Hanged Man',
    keywords: ['Surrender', 'Perspective', 'Pause', 'Sacrifice', 'Letting Go'],
    meaningUpright: 'Suspend action. Look at the situation from an inverted viewpoint to reveal what was hidden.',
    meaningReversed: 'Stagnation, useless martyrdom, or resisting the natural call to pause.',
    element: 'Water / Neptune'
  },
  {
    name: 'Death',
    keywords: ['Endings', 'Rebirth', 'Metamorphosis', 'Release', 'Transition'],
    meaningUpright: 'A profound ending paves the way for fresh renewal. Clear away the old to cultivate what is next.',
    meaningReversed: 'Fear of release, holding on to decay, or resisting an inevitable transformation.',
    element: 'Water / Scorpio'
  },
  {
    name: 'Temperance',
    keywords: ['Alchemy', 'Balance', 'Patience', 'Middle Path', 'Integration'],
    meaningUpright: 'Blend diverse elements into golden balance. Practice moderation and patience as situations ripen.',
    meaningReversed: 'Extremism, imbalance, haste, or clashing priorities creating friction.',
    element: 'Fire / Sagittarius'
  },
  {
    name: 'The Devil',
    keywords: ['Shadow Self', 'Attachment', 'Illusion', 'Temptation', 'Liberation'],
    meaningUpright: 'Examine unhealthy attachments, limiting habits, or self-imposed mental chains.',
    meaningReversed: 'Breaking free from destructive cycles, reclaiming autonomy and inner sovereignty.',
    element: 'Earth / Capricorn'
  },
  {
    name: 'The Tower',
    keywords: ['Awakening', 'Breakthrough', 'Truth', 'Ego Collapse', 'Liberation'],
    meaningUpright: 'False structures crumble so genuine truth can emerge. A shocking yet clarifying breakthrough.',
    meaningReversed: 'Averting disaster, delaying inevitable truth, or fear of personal upheaval.',
    element: 'Fire / Mars'
  },
  {
    name: 'The Star',
    keywords: ['Hope', 'Inspiration', 'Serenity', 'Guiding Light', 'Faith'],
    meaningUpright: 'Calm inspiration and renewed hope follow the storm. Trust in future horizons.',
    meaningReversed: 'Despair, cynicism, or lack of faith in your personal potential.',
    element: 'Air / Aquarius'
  },
  {
    name: 'The Moon',
    keywords: ['Illusion', 'Dreams', 'Unconscious', 'Shadows', 'Intuition'],
    meaningUpright: 'Things are not quite as they appear in the daylight. Navigate uncertainty with your nocturnal senses.',
    meaningReversed: 'Release of fear, dispelling confusing illusions, and emergence of clarity.',
    element: 'Water / Pisces'
  },
  {
    name: 'The Sun',
    keywords: ['Joy', 'Vitality', 'Clarity', 'Radiance', 'Celebration'],
    meaningUpright: 'Warmth, vitality, clarity, and uninhibited celebration. Your authentic self shines brightly.',
    meaningReversed: 'Temporary dimness, clouded optimism, or burning out from overexertion.',
    element: 'Fire / Sun'
  },
  {
    name: 'Judgement',
    keywords: ['Awakening', 'Calling', 'Higher Purpose', 'Absolution', 'Reckoning'],
    meaningUpright: 'Heed the call of your higher self. Forgive past mistakes and step up into renewed purpose.',
    meaningReversed: 'Harsh self-criticism, ignoring your vocation, or unresolved remorse.',
    element: 'Fire / Pluto'
  },
  {
    name: 'The World',
    keywords: ['Completion', 'Wholeness', 'Culmination', 'Integration', 'Harmony'],
    meaningUpright: 'A major cycle reaches triumphant completion. Celebrate wholeness and step through the threshold.',
    meaningReversed: 'Unfinished business, seeking closure from external sources, or delay at the finish line.',
    element: 'Earth / Saturn'
  }
];

// Oracle & Elemental archetypes for card counts beyond 22
const ORACLE_THEMES = [
  { name: 'Dawn of Insight', keywords: ['Clarity', 'Awakening', 'Perspective'], element: 'Air' },
  { name: 'Eternal Flame', keywords: ['Passion', 'Drive', 'Vitality'], element: 'Fire' },
  { name: 'Deep Waters', keywords: ['Reflection', 'Empathy', 'Flow'], element: 'Water' },
  { name: 'Sacred Earth', keywords: ['Grounding', 'Nourishment', 'Roots'], element: 'Earth' },
  { name: 'Starlit Horizon', keywords: ['Aspiration', 'Vision', 'Serenity'], element: 'Spirit' },
  { name: 'Ancient Forest', keywords: ['Ancestry', 'Patience', 'Shelter'], element: 'Earth' },
  { name: 'Whispering Wind', keywords: ['Communication', 'Truth', 'Change'], element: 'Air' },
  { name: 'Golden Solstice', keywords: ['Abundance', 'Triumph', 'Warmth'], element: 'Fire' }
];

export interface PopulatedCardData {
  name: string;
  keywords: string[];
  meaningUpright: string;
  meaningReversed: string;
  element: string;
}

/**
 * Automatically populates metadata for a snapped photo based on position and deck theme
 */
export function populateCardData(
  index: number,
  suggestedName?: string,
  deckTheme: 'tarot' | 'oracle' | 'runic' = 'tarot'
): PopulatedCardData {
  if (deckTheme === 'tarot' && index < TAROT_TEMPLATES.length) {
    const t = TAROT_TEMPLATES[index];
    return {
      name: suggestedName || t.name,
      keywords: [...t.keywords],
      meaningUpright: t.meaningUpright,
      meaningReversed: t.meaningReversed,
      element: t.element
    };
  }

  // Generic or extended card
  const oracleIdx = index % ORACLE_THEMES.length;
  const oracle = ORACLE_THEMES[oracleIdx];
  const cardNum = index + 1;

  return {
    name: suggestedName || (deckTheme === 'tarot' ? `Arcana #${cardNum}` : `${oracle.name} (${cardNum})`),
    keywords: [...oracle.keywords, 'Intuition', 'Daily Guidance'],
    meaningUpright: `Embrace the essence of ${oracle.name.toLowerCase()}. Align your current actions with patience, clarity, and true purpose.`,
    meaningReversed: `Reflect on any imbalance regarding ${oracle.keywords[0].toLowerCase()}. Pause and realign before taking the next step.`,
    element: oracle.element
  };
}

/**
 * Optionally analyzes the card photo using the server-side Gemini Vision API
 * if the user has an active connection, with automatic graceful fallback.
 */
export async function analyzeCardPhotoWithAI(
  imageBase64: string,
  cardIndex: number
): Promise<PopulatedCardData | null> {
  try {
    const res = await fetch('/api/analyze-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageBase64,
        index: cardIndex
      })
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data && data.name && Array.isArray(data.keywords)) {
      return {
        name: data.name,
        keywords: data.keywords,
        meaningUpright: data.meaningUpright || 'Trust your inner vision and step forward.',
        meaningReversed: data.meaningReversed || 'Take pause and realign with your true compass.',
        element: data.element || 'Ether'
      };
    }
  } catch (err) {
    // Gracefully fall back to local template generator
    console.debug('AI analysis unavailable, using local generator:', err);
  }

  return null;
}
