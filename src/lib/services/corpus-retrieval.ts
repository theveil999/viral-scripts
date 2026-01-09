/**
 * Corpus Retrieval Service
 * Hybrid search: metadata filtering + voice similarity + quality boost
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateEmbedding } from "./embeddings";

export interface CorpusMatch {
  id: string;
  content: string;
  hook: string;
  hook_type: string;
  script_archetype: string;
  parasocial_levers: string[];
  quality_score: number;
  similarity_score: number;
  match_reasons: string[];
  creator?: string;
}

export interface RetrievalOptions {
  limit?: number;
  minSimilarity?: number;
  diversify?: boolean;
  perHookType?: number;
  hookTypeFilter?: string;
  thematicQuery?: string; // Optional: "food", "dating", etc.
}

export interface RetrievalResult {
  matches: CorpusMatch[];
  retrieval_stats: {
    total_corpus: number;
    candidates_returned: number;
    avg_similarity: number;
    archetype_matches: number;
    lever_matches: number;
  };
}

/**
 * Retrieve corpus entries that match a model's voice
 * Uses hybrid search: metadata filtering + voice similarity
 */
export async function retrieveCorpusForModel(
  modelId: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult> {
  const {
    limit = 10,
    minSimilarity = 0.3,
    diversify = true,
    perHookType = 3,
    hookTypeFilter,
    thematicQuery,
  } = options;

  const supabase = createAdminClient();

  // 1. Get model with voice profile and embedding
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: model, error: modelError } = await (supabase
    .from("models") as any)
    .select("id, voice_profile, archetype_tags, embedding")
    .eq("id", modelId)
    .single();

  if (modelError || !model) {
    throw new Error(`Model not found: ${modelId}`);
  }

  // 2. Determine query embedding
  let queryEmbedding: number[];

  if (thematicQuery) {
    // If thematic query provided, embed the query + voice context
    const voiceContext =
      (model.voice_profile as any)?.identity?.quick_bio || "";
    const combinedQuery = `${thematicQuery}\n\nVoice style: ${voiceContext}`;
    queryEmbedding = await generateEmbedding(combinedQuery);
  } else if (model.embedding) {
    // Use the model's voice embedding
    // Handle both array and string representations from Supabase
    if (typeof model.embedding === 'string') {
      try {
        queryEmbedding = JSON.parse(model.embedding);
      } catch (parseError) {
        throw new Error(
          `Model embedding is malformed and cannot be parsed. Re-save the model to regenerate embedding. Details: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
        );
      }
    } else {
      queryEmbedding = model.embedding as unknown as number[];
    }
  } else {
    throw new Error(
      "Model has no embedding. Save the model again to generate one."
    );
  }

  // 3. Extract filter criteria from voice profile
  // NOTE: Model archetype_tags are PERSONALITY archetypes (girl_next_door, bratty_princess)
  // while corpus script_archetype are CONTENT types (thirst_commentary, fantasy_desire)
  // These are different taxonomies, so we DON'T filter by archetype - only by parasocial levers
  
  const voiceProfile = model.voice_profile as any;
  const leverFilter = voiceProfile?.parasocial_config?.strengths?.length
    ? voiceProfile.parasocial_config.strengths
    : voiceProfile?.parasocial?.strengths?.length
    ? voiceProfile.parasocial.strengths
    : null;

  // 4. Execute hybrid search
  const rpcName = diversify
    ? "match_corpus_diversified"
    : "match_corpus_hybrid";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpcParams: any = {
    query_embedding: queryEmbedding,
    min_similarity: minSimilarity,
    archetype_filter: null, // Disabled - model archetypes != corpus script_archetypes
    lever_filter: leverFilter,
  };

  if (diversify) {
    rpcParams.total_count = limit;
    rpcParams.per_hook_type = perHookType;
  } else {
    rpcParams.match_count = limit;
    if (hookTypeFilter) {
      rpcParams.hook_type_filter = hookTypeFilter;
    }
  }

  const { data: matchesData, error: searchError } = await supabase.rpc(
    rpcName,
    rpcParams
  );

  if (searchError) {
    console.error("Corpus search error:", searchError);
    throw searchError;
  }

  const matches = (matchesData || []) as CorpusMatch[];

  // 5. Calculate stats
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: totalCorpus } = await (supabase
    .from("corpus") as any)
    .select("*", { count: "exact", head: true })
    .not("embedding", "is", null);

  const archetypeMatches = matches.filter((m) =>
    m.match_reasons?.includes("archetype_match")
  ).length;

  const leverMatches = matches.filter((m) =>
    m.match_reasons?.includes("lever_match")
  ).length;

  const avgSimilarity = matches.length
    ? matches.reduce((sum, m) => sum + m.similarity_score, 0) / matches.length
    : 0;

  return {
    matches,
    retrieval_stats: {
      total_corpus: totalCorpus || 0,
      candidates_returned: matches.length,
      avg_similarity: avgSimilarity,
      archetype_matches: archetypeMatches,
      lever_matches: leverMatches,
    },
  };
}

/**
 * Quick semantic search for corpus (without model context)
 * Useful for exploring corpus by theme or topic
 */
export async function searchCorpusByTheme(
  query: string,
  options: { limit?: number; minSimilarity?: number } = {}
): Promise<CorpusMatch[]> {
  const { limit = 10, minSimilarity = 0.4 } = options;

  const supabase = createAdminClient();
  const queryEmbedding = await generateEmbedding(query);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("match_corpus_hybrid", {
    query_embedding: queryEmbedding,
    match_count: limit,
    min_similarity: minSimilarity,
    archetype_filter: null,
    lever_filter: null,
    hook_type_filter: null,
  });

  if (error) throw error;
  return (data || []) as CorpusMatch[];
}

/**
 * Alias for retrieveCorpusForModel (used by pipeline services)
 */
export async function retrieveRelevantCorpus(
  modelId: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult> {
  return retrieveCorpusForModel(modelId, options);
}

/**
 * Get corpus entries similar to a specific entry
 * Useful for finding related scripts or alternatives
 */
export async function findSimilarCorpusEntries(
  entryId: string,
  limit: number = 5
): Promise<CorpusMatch[]> {
  const supabase = createAdminClient();

  // Get the source entry's embedding
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: source, error: sourceError } = await (supabase
    .from("corpus") as any)
    .select("embedding")
    .eq("id", entryId)
    .single();

  if (sourceError || !source?.embedding) {
    throw new Error(`Entry not found or has no embedding: ${entryId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("match_corpus_hybrid", {
    query_embedding: source.embedding,
    match_count: limit + 1, // +1 because it will match itself
    min_similarity: 0.5,
    archetype_filter: null,
    lever_filter: null,
    hook_type_filter: null,
  });

  if (error) throw error;

  // Filter out the source entry itself
  return ((data || []) as CorpusMatch[]).filter((m) => m.id !== entryId);
}
