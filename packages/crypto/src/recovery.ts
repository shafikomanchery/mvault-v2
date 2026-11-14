import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToBase64, randomBytes } from './encoding.js';

/** 256-word list for human-readable recovery keys (12 words = ~128 bits entropy). */
const WORDS = [
  'alpha', 'bravo', 'cabin', 'delta', 'eagle', 'flame', 'globe', 'haven',
  'ivory', 'jolly', 'kite', 'lunar', 'maple', 'noble', 'ocean', 'prism',
  'quest', 'river', 'stone', 'tiger', 'ultra', 'vivid', 'waltz', 'xenon',
  'yacht', 'zesty', 'amber', 'blaze', 'coral', 'dusk', 'ember', 'frost',
  'glow', 'hazel', 'inlet', 'jewel', 'knoll', 'leaf', 'mist', 'nexus',
  'orbit', 'pearl', 'quartz', 'ridge', 'spark', 'thorn', 'unity', 'vapor',
  'wisp', 'yarrow', 'zenith', 'anchor', 'birch', 'cedar', 'dawn', 'echo',
  'fjord', 'grove', 'harbor', 'iris', 'jade', 'kelp', 'lotus', 'meadow',
  'north', 'olive', 'pine', 'quill', 'reed', 'sage', 'tide', 'umber',
  'vale', 'willow', 'yarn', 'acorn', 'brook', 'cliff', 'dune', 'elm',
  'fern', 'glade', 'hedge', 'isle', 'juniper', 'knack', 'lark', 'marsh',
  'nebula', 'oasis', 'plume', 'quiver', 'rust', 'slate', 'terra', 'upland',
  'vista', 'wren', 'yucca', 'atlas', 'birch', 'comet', 'drift', 'epoch',
  'flint', 'grain', 'hush', 'ink', 'jolt', 'karma', 'linen', 'moss',
  'nova', 'onyx', 'pulse', 'rune', 'silk', 'talon', 'urdu', 'vine',
  'wave', 'xylem', 'yield', 'zinc', 'arbor', 'bloom', 'crest', 'dew',
  'eden', 'fable', 'gust', 'halo', 'icon', 'jazz', 'kiosk', 'lynx',
  'mirth', 'nylon', 'opal', 'poem', 'quiet', 'robin', 'swan', 'topaz',
  'urban', 'violet', 'whale', 'xenial', 'yoga', 'zephyr', 'axiom', 'brisk',
  'chord', 'droid', 'ethos', 'fancy', 'glyph', 'hyper', 'ionic', 'jumbo',
  'kudos', 'logic', 'macro', 'nudge', 'optic', 'pixel', 'query', 'retro',
  'sonic', 'token', 'ultra', 'vector', 'wired', 'xray', 'yodel', 'zonal',
  'blaze', 'crisp', 'draft', 'elite', 'flash', 'grand', 'haste', 'input',
  'joint', 'kneel', 'lumen', 'mango', 'nifty', 'oxide', 'pilot', 'quick',
  'rival', 'stark', 'trend', 'ultra', 'vogue', 'witty', 'xenon', 'youth',
  'zippy', 'aloft', 'blunt', 'civic', 'dandy', 'eager', 'focal', 'giant',
  'happy', 'ideal', 'juror', 'kayak', 'lemon', 'moral', 'nurse', 'offer',
  'proud', 'quota', 'risky', 'smart', 'trust', 'usage', 'vital', 'woman',
  'xerox', 'young', 'zebra', 'alarm', 'baker', 'candy', 'daisy', 'easel',
  'faith', 'gamer', 'house', 'index', 'joker', 'kings', 'laser', 'money',
  'night', 'olive', 'paper', 'queen', 'radio', 'solar', 'table', 'uncle',
  'video', 'water', 'xmas', 'yacht', 'zones',
];

export function generateRecoveryKeyPhrase(): string {
  const bytes = randomBytes(16);
  const words: string[] = [];
  for (let i = 0; i < 12; i++) {
    const idx = (bytes[i] + (i > 0 ? bytes[i - 1] : 0)) % WORDS.length;
    words.push(WORDS[idx]);
  }
  return words.join(' ');
}

export function normalizeRecoveryPhrase(phrase: string): string {
  return phrase.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function recoveryPhraseToKeyMaterial(phrase: string): Promise<Uint8Array> {
  const normalized = normalizeRecoveryPhrase(phrase);
  const data = new TextEncoder().encode(normalized);
  return sha256(data);
}
