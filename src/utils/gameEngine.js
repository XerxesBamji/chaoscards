import { PROMPTS } from '../data/prompts';

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Fill template variables in a prompt string.
 * @param {string} template
 * @param {string[]} players
 * @param {string[]} extraPeople
 * @param {boolean} useExtra
 */
export function fillPrompt(template, players, extraPeople, useExtra) {
  const anyPool = useExtra && extraPeople.length > 0
    ? [...players, ...extraPeople]
    : [...players];

  let result = template;
  const usedPlayers = [];

  // Replace {player} first
  result = result.replace(/\{player\}/g, () => {
    const available = players.filter(p => !usedPlayers.includes(p));
    const picked = pickRandom(available.length > 0 ? available : players);
    usedPlayers.push(picked);
    return picked;
  });

  // Replace {player2} (different from first player if possible)
  result = result.replace(/\{player2\}/g, () => {
    const available = players.filter(p => !usedPlayers.includes(p));
    const picked = pickRandom(available.length > 0 ? available : players);
    usedPlayers.push(picked);
    return picked;
  });

  // Replace {any_name}
  result = result.replace(/\{any_name\}/g, () => {
    const available = anyPool.filter(p => !usedPlayers.includes(p));
    return pickRandom(available.length > 0 ? available : anyPool);
  });

  return result;
}

/**
 * Build a shuffled deck for a given mode.
 * customPrompts: string[] of raw template strings from the user.
 */
export function buildDeck(mode, players, extraPeople, useExtra, customPrompts = []) {
  let templates;
  if (mode === 'ultrachaos') {
    // Merge ALL mode prompts into one big pool
    templates = [
      ...PROMPTS.normal,
      ...PROMPTS.flirty,
      ...PROMPTS.chaos,
      ...PROMPTS.finalboss,
    ];
  } else {
    templates = PROMPTS[mode] || PROMPTS.normal;
  }

  // Append custom prompts (user-defined) to the pool
  if (customPrompts && customPrompts.length > 0) {
    templates = [...templates, ...customPrompts];
  }

  const shuffledTemplates = shuffle(templates);
  return shuffledTemplates.map(t => fillPrompt(t, players, extraPeople, useExtra));
}
