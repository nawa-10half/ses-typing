// ─── Types ───

export interface KanaChunk {
  kana: string
  options: string[]
}

export interface TypingState {
  chunks: KanaChunk[]
  chunkIndex: number
  inputBuffer: string
  completedRomaji: string[]
  completed: boolean
}

export type KeyResult = 'accept' | 'reject' | 'complete'

// ─── Kana → Romaji mapping ───

const KANA_MAP: Record<string, string[]> = {
  // Vowels
  'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
  // K-row
  'か': ['ka', 'ca'], 'き': ['ki'], 'く': ['ku', 'cu', 'qu'], 'け': ['ke'], 'こ': ['ko', 'co'],
  // S-row
  'さ': ['sa'], 'し': ['si', 'shi', 'ci'], 'す': ['su'], 'せ': ['se', 'ce'], 'そ': ['so'],
  // T-row
  'た': ['ta'], 'ち': ['ti', 'chi'], 'つ': ['tu', 'tsu'], 'て': ['te'], 'と': ['to'],
  // N-row
  'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
  // H-row
  'は': ['ha'], 'ひ': ['hi'], 'ふ': ['hu', 'fu'], 'へ': ['he'], 'ほ': ['ho'],
  // M-row
  'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
  // Y-row
  'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
  // R-row
  'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
  // W-row + wo
  'わ': ['wa'], 'を': ['wo'],

  // Dakuten G
  'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
  // Dakuten Z
  'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
  // Dakuten D
  'だ': ['da'], 'ぢ': ['di'], 'づ': ['du', 'zu'], 'で': ['de'], 'ど': ['do'],
  // Dakuten B
  'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
  // Handakuten P
  'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],

  // Yōon (compound)
  'きゃ': ['kya', 'kilya', 'kixya'], 'きゅ': ['kyu', 'kilyu', 'kixyu'], 'きょ': ['kyo', 'kilyo', 'kixyo'],
  'しゃ': ['sha', 'sya', 'shya', 'silya', 'sixya', 'cilya', 'cixya'],
  'しゅ': ['shu', 'syu', 'shyu', 'silyu', 'sixyu'],
  'しょ': ['sho', 'syo', 'shyo', 'silyo', 'sixyo'],
  'ちゃ': ['cha', 'tya', 'chya', 'cya', 'tilya', 'tixya', 'chilya', 'chixya'],
  'ちゅ': ['chu', 'tyu', 'chyu', 'cyu', 'tilyu', 'tixyu'],
  'ちょ': ['cho', 'tyo', 'chyo', 'cyo', 'tilyo', 'tixyo'],
  'にゃ': ['nya', 'nilya', 'nixya'], 'にゅ': ['nyu', 'nilyu', 'nixyu'], 'にょ': ['nyo', 'nilyo', 'nixyo'],
  'ひゃ': ['hya', 'hilya', 'hixya'], 'ひゅ': ['hyu', 'hilyu', 'hixyu'], 'ひょ': ['hyo', 'hilyo', 'hixyo'],
  'みゃ': ['mya', 'milya', 'mixya'], 'みゅ': ['myu', 'milyu', 'mixyu'], 'みょ': ['myo', 'milyo', 'mixyo'],
  'りゃ': ['rya', 'rilya', 'rixya'], 'りゅ': ['ryu', 'rilyu', 'rixyu'], 'りょ': ['ryo', 'rilyo', 'rixyo'],
  'ぎゃ': ['gya', 'gilya', 'gixya'], 'ぎゅ': ['gyu', 'gilyu', 'gixyu'], 'ぎょ': ['gyo', 'gilyo', 'gixyo'],
  'じゃ': ['ja', 'jya', 'zya', 'jilya', 'jixya', 'zilya', 'zixya'],
  'じゅ': ['ju', 'jyu', 'zyu', 'jilyu', 'jixyu', 'zilyu', 'zixyu'],
  'じょ': ['jo', 'jyo', 'zyo', 'jilyo', 'jixyo', 'zilyo', 'zixyo'],
  'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
  'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
}

// ─── Helper: vowel of a kana (for ー expansion) ───

function kanaVowel(ch: string): string {
  const iRow = 'いきしちにひみりぎじぢびぴぃ'
  const uRow = 'うくすつぬふむゆるぐずづぶぷぅゅ'
  const eRow = 'えけせてねへめれげぜでべぺぇ'
  const oRow = 'おこそとのほもよろをごぞどぼぽぉょ'
  if (iRow.includes(ch)) return 'い'
  if (uRow.includes(ch)) return 'う'
  if (eRow.includes(ch)) return 'え'
  if (oRow.includes(ch)) return 'お'
  return 'あ' // a-row + fallback
}

// Replace ー with the vowel kana of the preceding character
function expandChoon(kana: string): string {
  let result = ''
  for (let i = 0; i < kana.length; i++) {
    if (kana[i] === 'ー' && i > 0) {
      const prev = result[result.length - 1]
      result += kanaVowel(prev)
    } else {
      result += kana[i]
    }
  }
  return result
}

// ─── Parse kana string into chunks ───

function lookupNextKana(kana: string, start: number): { kanaStr: string; options: string[]; consumed: number } | null {
  if (start >= kana.length) return null
  // Try 2-char compound first
  if (start + 1 < kana.length) {
    const two = kana[start] + kana[start + 1]
    if (KANA_MAP[two]) return { kanaStr: two, options: KANA_MAP[two], consumed: 2 }
  }
  const one = kana[start]
  if (KANA_MAP[one]) return { kanaStr: one, options: KANA_MAP[one], consumed: 1 }
  return null
}

export function parseKana(rawKana: string): KanaChunk[] {
  const kana = expandChoon(rawKana)
  const chunks: KanaChunk[] = []
  let i = 0

  while (i < kana.length) {
    // ── っ: merge with next kana, double first consonant ──
    if (kana[i] === 'っ') {
      const next = lookupNextKana(kana, i + 1)
      if (next) {
        const doubled = next.options.map(o => o[0] + o)
        // Also allow explicit xtu/ltu + next
        const explicit = next.options.map(o => 'xtu' + o)
        const explicit2 = next.options.map(o => 'xtsu' + o)
        const explicit3 = next.options.map(o => 'ltu' + o)
        const explicit4 = next.options.map(o => 'ltsu' + o)
        chunks.push({
          kana: 'っ' + next.kanaStr,
          options: [...doubled, ...explicit, ...explicit2, ...explicit3, ...explicit4],
        })
        i += 1 + next.consumed
        continue
      }
      i++
      continue
    }

    // ── ん: context-dependent options ──
    if (kana[i] === 'ん') {
      const nextChar = kana[i + 1] as string | undefined
      const needsDouble =
        nextChar !== undefined && (
          'あいうえお'.includes(nextChar) ||
          'やゆよ'.includes(nextChar) ||
          'なにぬねの'.includes(nextChar) ||
          nextChar === 'ん'
        )

      if (needsDouble) {
        chunks.push({ kana: 'ん', options: ['nn', "n'", 'xn'] })
      } else {
        // Before consonant or at end — single n is OK
        chunks.push({ kana: 'ん', options: ['n', 'nn', "n'", 'xn'] })
      }
      i++
      continue
    }

    // ── Try 2-char compound ──
    if (i + 1 < kana.length) {
      const two = kana[i] + kana[i + 1]
      if (KANA_MAP[two]) {
        chunks.push({ kana: two, options: KANA_MAP[two] })
        i += 2
        continue
      }
    }

    // ── Single kana ──
    const one = kana[i]
    if (KANA_MAP[one]) {
      chunks.push({ kana: one, options: KANA_MAP[one] })
    }
    i++
  }

  return chunks
}

// ─── State management ───

export function createTypingState(kana: string): TypingState {
  return {
    chunks: parseKana(kana),
    chunkIndex: 0,
    inputBuffer: '',
    completedRomaji: [],
    completed: false,
  }
}

export function processKey(
  state: TypingState,
  key: string,
): { state: TypingState; result: KeyResult } {
  if (state.completed || state.chunkIndex >= state.chunks.length) {
    return { state, result: 'reject' }
  }

  const chunk = state.chunks[state.chunkIndex]
  const newBuffer = state.inputBuffer + key

  const exactMatch = chunk.options.includes(newBuffer)
  const isPrefix = chunk.options.some(o => o.startsWith(newBuffer) && o !== newBuffer)

  // Exact match and NOT a prefix of anything longer → chunk done
  if (exactMatch && !isPrefix) {
    return advanceChunk(state, newBuffer)
  }

  // Both exact and prefix (e.g. 'n' for ん when 'nn' is also valid)
  if (exactMatch && isPrefix) {
    return { state: { ...state, inputBuffer: newBuffer }, result: 'accept' }
  }

  // Just a prefix → keep going
  if (isPrefix) {
    return { state: { ...state, inputBuffer: newBuffer }, result: 'accept' }
  }

  // No match at all — but maybe the current buffer IS complete
  // and the new key starts the NEXT chunk (delayed commit for ん etc.)
  const currentComplete = chunk.options.includes(state.inputBuffer)
  if (currentComplete && state.chunkIndex + 1 < state.chunks.length) {
    const advanced: TypingState = {
      ...state,
      chunkIndex: state.chunkIndex + 1,
      inputBuffer: '',
      completedRomaji: [...state.completedRomaji, state.inputBuffer],
    }
    return processKey(advanced, key)
  }

  return { state, result: 'reject' }
}

function advanceChunk(
  state: TypingState,
  matched: string,
): { state: TypingState; result: KeyResult } {
  const nextIndex = state.chunkIndex + 1
  const newCompleted = [...state.completedRomaji, matched]

  if (nextIndex >= state.chunks.length) {
    return {
      state: { ...state, chunkIndex: nextIndex, inputBuffer: '', completedRomaji: newCompleted, completed: true },
      result: 'complete',
    }
  }
  return {
    state: { ...state, chunkIndex: nextIndex, inputBuffer: '', completedRomaji: newCompleted },
    result: 'accept',
  }
}

// ─── Display helpers ───

/** Full romaji string to display — adapts to the user's chosen path */
export function getDisplayRomaji(state: TypingState): string {
  let result = ''
  for (let i = 0; i < state.chunks.length; i++) {
    if (i < state.chunkIndex) {
      result += state.completedRomaji[i]
    } else if (i === state.chunkIndex) {
      const matching = state.chunks[i].options.filter(o => o.startsWith(state.inputBuffer))
      result += matching[0] ?? state.chunks[i].options[0]
    } else {
      result += state.chunks[i].options[0]
    }
  }
  return result
}

/** How many characters the user has typed so far */
export function getTypedLength(state: TypingState): number {
  let len = 0
  for (const r of state.completedRomaji) len += r.length
  len += state.inputBuffer.length
  return len
}

/** Default romaji (first option for every chunk) — used for timer calc */
export function getDefaultRomaji(kana: string): string {
  const chunks = parseKana(kana)
  return chunks.map(c => c.options[0]).join('')
}
