/**
 * Script Generation Service
 * Orchestrates the 6-stage AI pipeline for viral script generation
 *
 * Stages:
 * 1. Topic Selection - Pick topic from model's niche or user input
 * 2. Hook Generation - Generate compelling opening hooks
 * 3. Script Expansion - Expand hooks into full scripts
 * 4. Voice Transformation - Rewrite in model's exact voice
 * 5. Validation - Score and filter scripts
 * 6. Output Assembly - Package for database insertion
 */

import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { retrieveCorpusForModel, type CorpusMatch } from "./corpus-retrieval";

// ============================================================================
// TYPES
// ============================================================================

export interface GenerationRequest {
  modelId: string;
  topic?: string;
  hookType?: string;
  count?: number;
  explicitnessOverride?: "subtle" | "medium" | "full_send";
}

export interface GeneratedScript {
  content: string;
  hook: string;
  hookType: string;
  scriptArchetype: string;
  parasocialLevers: string[];
  wordCount: number;
  durationEstimate: number;
  voiceFidelityScore: number;
  validationPassed: boolean;
  validationIssues: string[];
  corpusReferences: string[];
  generationMetadata: {
    modelId: string;
    topic: string;
    generatedAt: string;
    pipelineVersion: string;
  };
}

export interface GenerationResult {
  success: boolean;
  scripts: GeneratedScript[];
  error?: string;
  stats: {
    totalGenerated: number;
    passedValidation: number;
    avgVoiceFidelity: number;
    generationTimeMs: number;
  };
}

interface Hook {
  content: string;
  hookType: string;
  parasocialLevers: string[];
  emotionalTone: string;
}

interface ExpandedScript {
  hook: string;
  content: string;
  hookType: string;
  scriptArchetype: string;
  parasocialLevers: string[];
  ctaType: string;
  durationEstimate: number;
  wordCount: number;
}

interface TransformedScript {
  originalContent: string;
  transformedContent: string;
  voiceElementsUsed: {
    fillerWords: string[];
    sentenceStarters: string[];
    catchphrases: string[];
    swearWords: string[];
    emphasis: string[];
  };
  boundaryCheck: "passed" | "flagged";
}

interface ValidationResult {
  scriptIndex: number;
  voiceFidelityScore: number;
  aiTellCheck: { passed: boolean; flaggedPhrases: string[] };
  parasocialLeversFound: string[];
  boundaryCheck: { passed: boolean; violations: string[] };
  overallStatus: "approved" | "regenerate" | "flagged";
  failureReasons: string[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VoiceProfile = any;

// ============================================================================
// CONSTANTS
// ============================================================================

const PIPELINE_VERSION = "1.0.0";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;

const AI_TELL_PHRASES = [
  "Furthermore",
  "Additionally",
  "Moreover",
  "Nevertheless",
  "Consequently",
  "Thus",
  "Hence",
  "It's important to note",
  "One could argue",
  "Interestingly enough",
  "That being said",
  "At the end of the day",
  "In today's world",
  "Many people don't realize",
  "As someone who",
  "I find it fascinating",
  "It's worth noting",
];

// ============================================================================
// ANTHROPIC CLIENT
// ============================================================================

let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseJsonResponse<T>(text: string): T {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }
    throw new Error("Failed to parse JSON response");
  }
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function estimateDuration(wordCount: number): number {
  // Average speaking rate ~2.5 words per second
  return Math.round(wordCount / 2.5);
}

function checkForAiTells(content: string): string[] {
  const found: string[] = [];
  const lowerContent = content.toLowerCase();
  for (const phrase of AI_TELL_PHRASES) {
    if (lowerContent.includes(phrase.toLowerCase())) {
      found.push(phrase);
    }
  }
  return found;
}

// ============================================================================
// STAGE 1: TOPIC SELECTION
// ============================================================================

export function selectTopic(
  voiceProfile: VoiceProfile,
  requestedTopic?: string
): string {
  if (requestedTopic) {
    return requestedTopic;
  }

  // Pick from model's niche topics
  const nicheTopics = voiceProfile?.content?.niche_topics || [];
  const canTalkAbout = voiceProfile?.content?.can_talk_hours_about || [];
  const allTopics = [...nicheTopics, ...canTalkAbout];

  if (allTopics.length === 0) {
    return "dating and relationships"; // Default fallback
  }

  return allTopics[Math.floor(Math.random() * allTopics.length)];
}

// ============================================================================
// STAGE 2: HOOK GENERATION
// ============================================================================

export async function generateHooks(
  voiceProfile: VoiceProfile,
  corpusExamples: CorpusMatch[],
  topic: string,
  count: number = 3,
  hookTypeFilter?: string
): Promise<Hook[]> {
  const client = getAnthropicClient();

  // Build corpus hooks section
  const corpusHooks = corpusExamples
    .slice(0, 10)
    .map(
      (c) =>
        `- [${c.hook_type}] "${c.hook}" (similarity: ${(c.similarity_score * 100).toFixed(0)}%)`
    )
    .join("\n");

  // Build prompt
  const prompt = `You are generating viral Instagram Reels hooks for an OnlyFans model. These hooks must capture attention in the first 3 seconds and sound exactly like the model speaks.

## Model Profile
\`\`\`json
${JSON.stringify(voiceProfile, null, 2)}
\`\`\`

## Topic Focus
Generate hooks about: ${topic}

## Corpus Examples (High-Performing Hooks)
${corpusHooks}

## Hook Types to Generate${hookTypeFilter ? ` (focus on ${hookTypeFilter})` : " (distribute across these)"}
- **bold_statement**: Strong declarative opening ("Nothing is hotter than...", "The hottest thing...")
- **question**: Direct question to audience ("Do you ever...", "Did you know...")
- **challenge**: Provocative/conditional opener ("If your girl doesn't...", "If he can't...")
- **fantasy**: Describing desired scenario ("I want a man who...", "I need someone who...")
- **relatable**: Shared experience observation ("Love when...", "I'm the type of girlfriend...")
- **confession**: Admitting something personal/taboo ("My toxic trait is...", "I'm not ashamed to admit...")
- **hot_take**: Controversial opinion ("Unpopular opinion but...")
- **storytime**: Narrative opener ("Random storytime but...", "Okay so one time...")

## Voice Matching Requirements
INJECT her voice patterns:
- Filler words: ${JSON.stringify(voiceProfile?.voice_mechanics?.filler_words || [])}
- Sentence starters: ${JSON.stringify(voiceProfile?.voice_mechanics?.sentence_starters || [])}
- Catchphrases: ${JSON.stringify(voiceProfile?.voice_mechanics?.catchphrases || [])}

MATCH her style:
- Energy level: ${voiceProfile?.personality?.energy_level || "medium"}
- Explicitness: ${voiceProfile?.spicy?.explicitness_level || "medium"}

## Parasocial Levers to Include
Prioritize these levers: ${JSON.stringify(voiceProfile?.parasocial_config?.strengths || voiceProfile?.parasocial?.strengths || [])}
Avoid these levers: ${JSON.stringify(voiceProfile?.parasocial_config?.avoid || voiceProfile?.parasocial?.avoid || [])}

## BANNED PHRASES (Never use - they sound AI-generated)
${AI_TELL_PHRASES.map((p) => `- "${p}"`).join("\n")}

## Output Format
Generate ${count} unique hooks. Return ONLY valid JSON:
{
  "hooks": [
    {
      "content": "the hook text exactly as she would say it",
      "hookType": "bold_statement|question|challenge|fantasy|relatable|confession|hot_take|storytime",
      "parasocialLevers": ["direct_address", "sexual_tension"],
      "emotionalTone": "playful|vulnerable|confident|chaotic|sensual|bratty"
    }
  ]
}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";
  const parsed = parseJsonResponse<{ hooks: Hook[] }>(responseText);
  return parsed.hooks;
}

// ============================================================================
// STAGE 3: SCRIPT EXPANSION
// ============================================================================

export async function expandScript(
  voiceProfile: VoiceProfile,
  hook: Hook,
  corpusExamples: CorpusMatch[]
): Promise<ExpandedScript> {
  const client = getAnthropicClient();

  // Get corpus scripts for style reference
  const corpusScripts = corpusExamples
    .slice(0, 5)
    .map(
      (c) =>
        `[${c.script_archetype}] ${c.content.slice(0, 200)}${c.content.length > 200 ? "..." : ""}`
    )
    .join("\n\n");

  const prompt = `You are expanding a hook into a complete viral Instagram Reels script. Target 30-50 words (12-18 seconds when spoken).

## Model Profile
\`\`\`json
${JSON.stringify(voiceProfile, null, 2)}
\`\`\`

## Hook to Expand
"${hook.content}"
Type: ${hook.hookType}
Tone: ${hook.emotionalTone}

## Corpus Examples (Style References)
${corpusScripts}

## Script Archetypes & Structures
- **thirst_commentary**: Observation → Reaction → Escalate desire → Playful close
- **fantasy_desire**: Hook → Build desire → Intensify → Soft CTA
- **confession**: Hook → Confession → Reaction → Normalize
- **storytime**: Hook → Setup → Event → Punchline/Twist
- **relatable_rant**: Hook → Frustration → Escalate → Commiserate

## Parasocial Requirements
Every script MUST have at least 2 parasocial levers.
Prioritize: ${JSON.stringify(voiceProfile?.parasocial_config?.strengths || voiceProfile?.parasocial?.strengths || [])}
Avoid: ${JSON.stringify(voiceProfile?.parasocial_config?.avoid || voiceProfile?.parasocial?.avoid || [])}

## CTA Options (use sparingly - only 30% of scripts)
Use her CTA style: ${voiceProfile?.voice_mechanics?.cta_style || "follow me I miss you"}

## Output Format
Return ONLY valid JSON:
{
  "hook": "${hook.content}",
  "content": "full script including the hook",
  "hookType": "${hook.hookType}",
  "scriptArchetype": "thirst_commentary|fantasy_desire|confession|storytime|relatable_rant|advice_tip",
  "parasocialLevers": ["lever1", "lever2"],
  "ctaType": "follow|engagement|none",
  "durationEstimate": 14,
  "wordCount": 38
}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";
  return parseJsonResponse<ExpandedScript>(responseText);
}

// ============================================================================
// STAGE 4: VOICE TRANSFORMATION
// ============================================================================

export async function transformVoice(
  voiceProfile: VoiceProfile,
  script: ExpandedScript
): Promise<TransformedScript> {
  const client = getAnthropicClient();

  // Get sample speech for reference
  const sampleSpeech = voiceProfile?.sample_speech || [];

  const prompt = `**THIS IS THE MOST CRITICAL STAGE.** Transform this script to sound EXACTLY like the model speaks. Voice fidelity is everything.

## Model Profile (Study Carefully)
\`\`\`json
${JSON.stringify(voiceProfile, null, 2)}
\`\`\`

## Sample Speech (How She ACTUALLY Talks)
${sampleSpeech.map((s: string) => `"${s}"`).join("\n")}

## Script to Transform
"${script.content}"

## VOICE TRANSFORMATION RULES

### 1. INJECT Her Specific Patterns
- Filler words (use at her frequency): ${JSON.stringify(voiceProfile?.voice_mechanics?.filler_words || [])}
- Sentence starters: ${JSON.stringify(voiceProfile?.voice_mechanics?.sentence_starters || [])}
- Self-interruption patterns: ${JSON.stringify(voiceProfile?.voice_mechanics?.self_interruption_patterns || [])}
- Catchphrases: ${JSON.stringify(voiceProfile?.voice_mechanics?.catchphrases || [])}
- Swear words: ${JSON.stringify(voiceProfile?.voice_mechanics?.swear_words || [])}
- Swear frequency: ${voiceProfile?.voice_mechanics?.swear_frequency || "low"}

### 2. MATCH Her Rhythm
- Sentence length: ${voiceProfile?.voice_mechanics?.avg_sentence_length || "medium"}
- Sentence style: ${voiceProfile?.voice_mechanics?.sentence_style || "complete"}
- Question frequency: ${voiceProfile?.voice_mechanics?.question_frequency || "medium"}

### 3. MATCH Her Energy
- Energy level: ${voiceProfile?.personality?.energy_level || "medium"}
- Humor style: ${voiceProfile?.personality?.humor_style || "both"}

### 4. MATCH Her Explicitness
- Level: ${voiceProfile?.spicy?.explicitness_level || "medium"}

### 5. Emphasis Style
- Uses caps: ${voiceProfile?.voice_mechanics?.emphasis_style?.uses_caps || false}
- Stretches words: ${voiceProfile?.voice_mechanics?.emphasis_style?.stretches_words || false}
- Uses repetition: ${voiceProfile?.voice_mechanics?.emphasis_style?.uses_repetition || false}

## ABSOLUTE BANS (Instant Failure)
${AI_TELL_PHRASES.map((p) => `- "${p}"`).join("\n")}

## BOUNDARY CHECK
Hard nos: ${JSON.stringify(voiceProfile?.boundaries?.hard_nos || [])}
Topics to avoid: ${JSON.stringify(voiceProfile?.boundaries?.topics_to_avoid || [])}

## Output Format
Return ONLY valid JSON:
{
  "originalContent": "${script.content.replace(/"/g, '\\"')}",
  "transformedContent": "the voice-matched script",
  "voiceElementsUsed": {
    "fillerWords": ["like", "honestly"],
    "sentenceStarters": ["okay so"],
    "catchphrases": [],
    "swearWords": [],
    "emphasis": []
  },
  "boundaryCheck": "passed"
}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";
  return parseJsonResponse<TransformedScript>(responseText);
}

// ============================================================================
// STAGE 5: VALIDATION
// ============================================================================

export async function validateScript(
  voiceProfile: VoiceProfile,
  content: string,
  scriptIndex: number
): Promise<ValidationResult> {
  const client = getAnthropicClient();

  const prompt = `You are validating a generated script for quality, voice fidelity, and policy compliance.

## Model Profile
\`\`\`json
${JSON.stringify(voiceProfile, null, 2)}
\`\`\`

## Script to Validate
"${content}"

## VALIDATION CHECKS

### 1. AI-Tell Scan (HARD FAIL if any found)
Scan for these banned phrases:
${AI_TELL_PHRASES.map((p) => `- "${p}"`).join("\n")}

### 2. Voice Fidelity Score (0-100)
Score each criterion:
- Filler word presence (20%): Are her fillers present?
- Sentence starter match (15%): Does she start sentences her way?
- Vocabulary match (20%): 80%+ words in her typical vocabulary?
- Sentence length match (15%): Matches her rhythm?
- Catchphrase inclusion (10%): Her phrases present?
- Energy level match (10%): Feels like her energy?
- Swearing calibration (5%): Right words, right frequency?
- No AI tells (5%): Clean of banned patterns?

Threshold: 85/100 to pass

### 3. Parasocial Lever Check
Identify which levers are present: direct_address, sexual_tension, relatability, vulnerability, confession, exclusivity, challenge, praise, dominance, playful_self_deprecation, inside_reference, aspiration, pseudo_intimacy, boyfriend_fantasy, protector_dynamic

### 4. Boundary Compliance (HARD FAIL if violated)
Hard nos: ${JSON.stringify(voiceProfile?.boundaries?.hard_nos || [])}
Topics to avoid: ${JSON.stringify(voiceProfile?.boundaries?.topics_to_avoid || [])}

## Output Format
Return ONLY valid JSON:
{
  "scriptIndex": ${scriptIndex},
  "voiceFidelityScore": 87,
  "aiTellCheck": {
    "passed": true,
    "flaggedPhrases": []
  },
  "parasocialLeversFound": ["direct_address", "vulnerability"],
  "boundaryCheck": {
    "passed": true,
    "violations": []
  },
  "overallStatus": "approved",
  "failureReasons": []
}`;

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    response.content[0].type === "text" ? response.content[0].text : "";
  return parseJsonResponse<ValidationResult>(responseText);
}

// ============================================================================
// STAGE 6: OUTPUT ASSEMBLY
// ============================================================================

function assembleOutput(
  modelId: string,
  topic: string,
  expandedScript: ExpandedScript,
  transformedScript: TransformedScript,
  validationResult: ValidationResult,
  corpusRefs: string[]
): GeneratedScript {
  const content = transformedScript.transformedContent;
  const wordCount = countWords(content);

  return {
    content,
    hook: expandedScript.hook,
    hookType: expandedScript.hookType,
    scriptArchetype: expandedScript.scriptArchetype,
    parasocialLevers: validationResult.parasocialLeversFound,
    wordCount,
    durationEstimate: estimateDuration(wordCount),
    voiceFidelityScore: validationResult.voiceFidelityScore / 100, // Normalize to 0-1
    validationPassed: validationResult.overallStatus === "approved",
    validationIssues: validationResult.failureReasons,
    corpusReferences: corpusRefs,
    generationMetadata: {
      modelId,
      topic,
      generatedAt: new Date().toISOString(),
      pipelineVersion: PIPELINE_VERSION,
    },
  };
}

// ============================================================================
// MAIN ORCHESTRATION FUNCTION
// ============================================================================

export async function generateScripts(
  request: GenerationRequest
): Promise<GenerationResult> {
  const startTime = Date.now();
  const scripts: GeneratedScript[] = [];
  const count = request.count || 1;

  try {
    // Get model from database
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: model, error: modelError } = await (supabase
      .from("models") as any)
      .select("*")
      .eq("id", request.modelId)
      .single();

    if (modelError || !model) {
      return {
        success: false,
        scripts: [],
        error: `Model not found: ${request.modelId}`,
        stats: {
          totalGenerated: 0,
          passedValidation: 0,
          avgVoiceFidelity: 0,
          generationTimeMs: Date.now() - startTime,
        },
      };
    }

    const voiceProfile = model.voice_profile as VoiceProfile;

    // Apply explicitness override if provided
    if (request.explicitnessOverride && voiceProfile?.spicy) {
      voiceProfile.spicy.explicitness_level = request.explicitnessOverride;
    }

    // Stage 1: Topic Selection
    console.log("[Stage 1] Selecting topic...");
    const topic = selectTopic(voiceProfile, request.topic);
    console.log(`  Topic: ${topic}`);

    // Stage 1b: Corpus Retrieval
    console.log("[Stage 1b] Retrieving corpus examples...");
    const corpusResult = await retrieveCorpusForModel(request.modelId, {
      limit: 10,
      diversify: true,
      thematicQuery: topic,
    });
    const corpusExamples = corpusResult.matches;
    const corpusRefs = corpusExamples.map((c) => c.id);
    console.log(`  Found ${corpusExamples.length} matching corpus entries`);

    // Stage 2: Hook Generation
    console.log(`[Stage 2] Generating ${count} hooks...`);
    const hooks = await generateHooks(
      voiceProfile,
      corpusExamples,
      topic,
      count,
      request.hookType
    );
    console.log(`  Generated ${hooks.length} hooks`);

    // Process each hook through stages 3-6
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      console.log(`[Processing hook ${i + 1}/${hooks.length}]`);

      try {
        // Stage 3: Script Expansion
        console.log("  [Stage 3] Expanding script...");
        const expandedScript = await expandScript(
          voiceProfile,
          hook,
          corpusExamples
        );

        // Stage 4: Voice Transformation
        console.log("  [Stage 4] Transforming voice...");
        let transformedScript = await transformVoice(voiceProfile, expandedScript);

        // Stage 5: Validation
        console.log("  [Stage 5] Validating...");
        let validationResult = await validateScript(
          voiceProfile,
          transformedScript.transformedContent,
          i
        );

        // If validation fails, attempt one regeneration
        if (validationResult.overallStatus === "regenerate") {
          console.log("  [Stage 4-5] Regenerating failed script...");
          transformedScript = await transformVoice(voiceProfile, expandedScript);
          validationResult = await validateScript(
            voiceProfile,
            transformedScript.transformedContent,
            i
          );
        }

        // Stage 6: Output Assembly
        console.log("  [Stage 6] Assembling output...");
        const generatedScript = assembleOutput(
          request.modelId,
          topic,
          expandedScript,
          transformedScript,
          validationResult,
          corpusRefs
        );

        scripts.push(generatedScript);
        console.log(
          `  Completed: ${generatedScript.validationPassed ? "✓ PASSED" : "✗ FAILED"} (${generatedScript.voiceFidelityScore * 100}%)`
        );
      } catch (hookError) {
        console.error(`  Error processing hook ${i + 1}:`, hookError);
        // Continue with other hooks
      }
    }

    // Calculate stats
    const passedCount = scripts.filter((s) => s.validationPassed).length;
    const avgFidelity =
      scripts.length > 0
        ? scripts.reduce((sum, s) => sum + s.voiceFidelityScore, 0) /
          scripts.length
        : 0;

    return {
      success: true,
      scripts,
      stats: {
        totalGenerated: scripts.length,
        passedValidation: passedCount,
        avgVoiceFidelity: avgFidelity,
        generationTimeMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error("Script generation error:", error);
    return {
      success: false,
      scripts,
      error: error instanceof Error ? error.message : "Unknown error",
      stats: {
        totalGenerated: scripts.length,
        passedValidation: scripts.filter((s) => s.validationPassed).length,
        avgVoiceFidelity: 0,
        generationTimeMs: Date.now() - startTime,
      },
    };
  }
}
