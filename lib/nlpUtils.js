/**
 * nlpUtils.js
 * Lightweight deterministic NLP pipeline for ASL tokenization.
 * No external ML models — pure rule-based processing.
 */

// ---------------------------------------------------------------------------
// 1. Words to strip: ASL omits articles, copulas, and prepositions that have
//    no equivalent sign. This list covers the most common omissions.
// ---------------------------------------------------------------------------
const ASL_STOP_WORDS = new Set([
  'a', 'an', 'the',
  'is', 'are', 'am', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did',
  'have', 'has', 'had',
  'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as',
  'and', 'or', 'but', 'if', 'so', 'yet', 'nor',
  'it', 'its', 'this', 'that', 'these', 'those',
  'very', 'just', 'too', 'also',
]);

// ---------------------------------------------------------------------------
// 2. Lemmatization rules — deterministic suffix stripping.
//    Order matters: evaluate longest suffixes first.
// ---------------------------------------------------------------------------
const LEMMA_RULES = [
  // Irregular forms (checked first — exact match)
  { type: 'exact', from: 'talking',   to: 'talk'   },
  { type: 'exact', from: 'saying',    to: 'say'    },
  { type: 'exact', from: 'going',     to: 'go'     },
  { type: 'exact', from: 'doing',     to: 'do'     },
  { type: 'exact', from: 'having',    to: 'have'   },
  { type: 'exact', from: 'making',    to: 'make'   },
  { type: 'exact', from: 'running',   to: 'run'    },
  { type: 'exact', from: 'seeing',    to: 'see'    },
  { type: 'exact', from: 'coming',    to: 'come'   },
  { type: 'exact', from: 'getting',   to: 'get'    },
  { type: 'exact', from: 'knowing',   to: 'know'   },
  { type: 'exact', from: 'thinking',  to: 'think'  },
  { type: 'exact', from: 'helping',   to: 'help'   },
  { type: 'exact', from: 'needing',   to: 'need'   },
  { type: 'exact', from: 'wanting',   to: 'want'   },
  { type: 'exact', from: 'loves',     to: 'love'   },
  { type: 'exact', from: 'loved',     to: 'love'   },
  { type: 'exact', from: 'loving',    to: 'love'   },
  { type: 'exact', from: 'thanks',    to: 'thank'  },
  { type: 'exact', from: 'thanked',   to: 'thank'  },
  { type: 'exact', from: 'thanking',  to: 'thank'  },
  // Suffix rules
  { type: 'suffix', from: 'ying',     to: 'y'      },  // studying → study
  { type: 'suffix', from: 'ies',      to: 'y'      },  // studies  → study
  { type: 'suffix', from: 'ied',      to: 'y'      },  // studied  → study
  { type: 'suffix', from: 'ving',     to: 've'     },  // giving   → give (remove v only)
  { type: 'suffix', from: 'ing',      to: ''       },  // walking  → walk
  { type: 'suffix', from: 'tion',     to: 't'      },  // action   → act (approximate)
  { type: 'suffix', from: 'ness',     to: ''       },  // darkness → dark
  { type: 'suffix', from: 'ment',     to: ''       },  // movement → move (see 'ing' already applied)
  { type: 'suffix', from: 'ful',      to: ''       },  // helpful  → help
  { type: 'suffix', from: 'less',     to: ''       },  // hopeless → hope
  { type: 'suffix', from: 'ly',       to: ''       },  // quickly  → quick
  { type: 'suffix', from: 'able',     to: ''       },  // readable → read
  { type: 'suffix', from: 'ible',     to: ''       },
  { type: 'suffix', from: 'ive',      to: ''       },
  { type: 'suffix', from: 'ous',      to: ''       },
  { type: 'suffix', from: 'al',       to: ''       },
  { type: 'suffix', from: 'ed',       to: ''       },  // walked  → walk
  { type: 'suffix', from: 's',        to: ''       },  // cats    → cat (must be last)
];

// Minimum output word length — prevents stripping producing single char garbage
const MIN_LEMMA_LENGTH = 2;

/**
 * Apply a single lemmatization pass to a lowercase word.
 * Returns the lemma if a rule matches, otherwise the original word.
 */
function applyLemmaRules(word) {
  for (const rule of LEMMA_RULES) {
    if (rule.type === 'exact') {
      if (word === rule.from) return rule.to;
      continue;
    }
    // Suffix rule
    if (word.endsWith(rule.from)) {
      const stem = word.slice(0, word.length - rule.from.length) + rule.to;
      if (stem.length >= MIN_LEMMA_LENGTH) return stem;
    }
  }
  return word;
}

/**
 * Lemmatize a word. Applies up to two passes to catch cascading suffixes
 * (e.g., "darknesses" → "darkness" → "dark").
 */
function lemmatize(word) {
  const pass1 = applyLemmaRules(word);
  if (pass1 !== word) {
    const pass2 = applyLemmaRules(pass1);
    return pass2;
  }
  return word;
}

// ---------------------------------------------------------------------------
// 3. Text normalization
// ---------------------------------------------------------------------------

/**
 * Normalise raw input text:
 *  - Lowercase
 *  - Strip punctuation except apostrophes (so "can't" → "cant" not "can" + "t")
 *  - Collapse whitespace
 */
function normalizeText(raw) {
  return raw
    .toLowerCase()
    .replace(/['']/g, '')       // remove apostrophes, merge contractions
    .replace(/[^a-z\s]/g, ' ') // replace non-alpha with space
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// 4. Main tokenizer
// ---------------------------------------------------------------------------

/**
 * Process raw input text and return an array of ASL tokens.
 * Each token is either a WORD key (checked against dictionary at render time)
 * or a single LETTER for fingerspelling.
 *
 * @param {string} rawText        - Raw string from speech or text input
 * @param {Set<string>} dictKeys  - Set of keys present in dictionary.json (uppercase)
 * @returns {{ token: string, type: 'word' | 'letter', source: string }[]}
 */
export function tokenize(rawText, dictKeys) {
  if (!rawText || !rawText.trim()) return [];

  const normalized = normalizeText(rawText);
  const words = normalized.split(' ').filter(Boolean);

  const tokens = [];

  for (const word of words) {
    // Drop stop words
    if (ASL_STOP_WORDS.has(word)) continue;

    // Lemmatize
    const lemma = lemmatize(word);

    // Check if lemma or original uppercased exists in dictionary
    const upperLemma = lemma.toUpperCase();
    const upperWord  = word.toUpperCase();

    if (dictKeys.has(upperLemma)) {
      tokens.push({ token: upperLemma, type: 'word', source: word });
    } else if (dictKeys.has(upperWord)) {
      tokens.push({ token: upperWord, type: 'word', source: word });
    } else {
      // Fingerspelling fallback — break into individual letters
      for (const letter of upperLemma) {
        if (/[A-Z]/.test(letter)) {
          tokens.push({ token: letter, type: 'letter', source: word });
        }
      }
    }
  }

  return tokens;
}

/**
 * Load dictionary keys from /dictionary.json.
 * Returns a Promise<Set<string>> of uppercase keys.
 */
export async function loadDictionaryKeys() {
  const res = await fetch('/dictionary.json');
  const data = await res.json();
  // Filter out the _comment key
  return new Set(
    Object.keys(data)
      .filter(k => !k.startsWith('_'))
      .map(k => k.toUpperCase())
  );
}

/**
 * Load the full dictionary map.
 * Returns Promise<Record<string, BonePose[]>>
 */
export async function loadDictionary() {
  const res = await fetch('/dictionary.json');
  const data = await res.json();
  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith('_')) {
      result[key.toUpperCase()] = value;
    }
  }
  return result;
}
