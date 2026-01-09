/**
 * Test script to verify the preserveHookOpener function works correctly
 * Run with: npx tsx scripts/test-filler-removal.ts
 */

// Test cases - these simulate what Claude might return
const testCases = [
  {
    originalHook: "I need a man who grabs my chin",
    transformed: "Okay so like, I need a man who grabs my chin and calls me good girl, you know?",
    expectedStart: "I need a man who",
  },
  {
    originalHook: "Do you ever just melt from a guy's voice?",
    transformed: "So like, do you ever just melt from a guy's voice? Like when he whispers...",
    expectedStart: "Do you ever",
  },
  {
    originalHook: "My toxic trait is that I'll pull your pants down",
    transformed: "Um okay so like, my toxic trait is that I'll pull your pants down while we're arguing...",
    expectedStart: "My toxic trait",
  },
  {
    originalHook: "Nothing is hotter than a man who can cook",
    transformed: "Okay so, nothing is hotter than a man who can cook, like seriously...",
    expectedStart: "Nothing is hotter",
  },
  {
    originalHook: "If you can't handle my chaos",
    transformed: "Like, if you can't handle my chaos, then you don't deserve my calm...",
    expectedStart: "If you can",
  },
  // Test case where hook is already at start (should not change)
  {
    originalHook: "I want a man who will fight for me",
    transformed: "I want a man who will fight for me, you know? Like actually stand up...",
    expectedStart: "I want a man",
  },
  // Complex filler patterns
  {
    originalHook: "When a guy looks at you that way",
    transformed: "Um so like okay, when a guy looks at you that way, like with those eyes...",
    expectedStart: "When a guy",
  },
]

// Implementation of the functions (copied from voice-transformation.ts for testing)
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function getFirstWords(text: string, count: number): string[] {
  const normalized = normalizeForComparison(text)
  return normalized.split(' ').slice(0, count)
}

function startsWithWords(text: string, words: string[]): boolean {
  const normalized = normalizeForComparison(text)
  const pattern = words.join(' ')
  return normalized.startsWith(pattern)
}

const LEADING_FILLER_PATTERNS = [
  /^okay\s+so\s+like\s*,?\s*/i,
  /^ok\s+so\s+like\s*,?\s*/i,
  /^um+\s+okay\s+so\s+like\s*,?\s*/i,
  /^um+\s+ok\s+so\s+like\s*,?\s*/i,
  /^um+\s+so\s+like\s*,?\s*/i,
  /^so\s+like\s*,?\s*/i,
  /^okay\s+so\s*,?\s*/i,
  /^ok\s+so\s*,?\s*/i,
  /^um+\s+like\s*,?\s*/i,
  /^um+\s+okay\s*,?\s*/i,
  /^um+\s+ok\s*,?\s*/i,
  /^um+\s*,?\s*/i,
  /^like\s*,?\s*/i,
  /^so\s*,?\s+/i,
  /^okay\s*,?\s*/i,
  /^ok\s*,?\s*/i,
  /^yeah\s+so\s*,?\s*/i,
  /^well\s+so\s*,?\s*/i,
  /^honestly\s*,?\s*/i,
  /^look\s*,?\s*/i,
  /^listen\s*,?\s*/i,
]

function findHookStart(script: string, hookWords: string[]): number {
  const scriptNormalized = normalizeForComparison(script)
  const hookPattern = hookWords.join(' ')
  
  const hookIndex = scriptNormalized.indexOf(hookPattern)
  if (hookIndex === -1) return -1
  
  let normalizedPos = 0
  for (let i = 0; i < script.length; i++) {
    if (normalizedPos >= hookIndex) {
      return i
    }
    const char = script[i].toLowerCase()
    if (/[a-z0-9\s]/.test(char)) {
      if (char === ' ' || (i > 0 && script[i-1] !== ' ')) {
        normalizedPos++
      }
    }
  }
  return -1
}

function preserveHookOpener(transformedScript: string, originalHook: string): string {
  if (!transformedScript || !originalHook) return transformedScript
  
  let script = transformedScript.trim()
  
  const hookWords = getFirstWords(originalHook, 5).filter(w => w.length > 0)
  if (hookWords.length === 0) return script
  
  const hookMatchWords = hookWords.slice(0, Math.min(4, hookWords.length))
  
  if (startsWithWords(script, hookMatchWords)) {
    return script
  }
  
  let previousScript = ''
  let iterations = 0
  const maxIterations = 10
  
  while (previousScript !== script && iterations < maxIterations) {
    previousScript = script
    iterations++
    
    for (const pattern of LEADING_FILLER_PATTERNS) {
      const newScript = script.replace(pattern, '')
      if (newScript !== script) {
        script = newScript.trim()
        break
      }
    }
  }
  
  if (startsWithWords(script, hookMatchWords)) {
    return script
  }
  
  const hookStartIndex = findHookStart(script, hookMatchWords)
  
  if (hookStartIndex > 0 && hookStartIndex < 100) {
    const trimmedScript = script.slice(hookStartIndex).trim()
    
    if (startsWithWords(trimmedScript, hookMatchWords)) {
      return trimmedScript
    }
  }
  
  return script
}

// Run tests
console.log('🧪 Testing preserveHookOpener function...\n')

let passed = 0
let failed = 0

for (const testCase of testCases) {
  const result = preserveHookOpener(testCase.transformed, testCase.originalHook)
  const startOk = normalizeForComparison(result).startsWith(normalizeForComparison(testCase.expectedStart))
  
  if (startOk) {
    console.log(`✅ PASS: Hook "${testCase.originalHook.slice(0, 30)}..."`)
    console.log(`   Input:    "${testCase.transformed.slice(0, 60)}..."`)
    console.log(`   Output:   "${result.slice(0, 60)}..."`)
    passed++
  } else {
    console.log(`❌ FAIL: Hook "${testCase.originalHook.slice(0, 30)}..."`)
    console.log(`   Input:    "${testCase.transformed}"`)
    console.log(`   Output:   "${result}"`)
    console.log(`   Expected to start with: "${testCase.expectedStart}"`)
    failed++
  }
  console.log('')
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`)

if (failed > 0) {
  process.exit(1)
}

