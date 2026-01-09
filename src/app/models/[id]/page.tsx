"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  MessageSquare,
  User,
  Heart,
  AlertTriangle,
  Quote,
  Tag,
  Shield,
  X,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Model } from "@/lib/supabase/types";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  ArchetypeBadge,
  Avatar,
  SkeletonProfile,
} from "@/components/ui";

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate scripts modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    hookType: "",
    count: 3,
    saveToDb: true,
  });
  const [generateResult, setGenerateResult] = useState<{
    success: boolean;
    error?: string;
    stats?: {
      totalGenerated: number;
      passedValidation: number;
      avgVoiceFidelity: number;
    };
  } | null>(null);

  const handleGenerateScripts = async () => {
    if (!model) return;

    setIsGenerating(true);
    setGenerateResult(null);

    try {
      const response = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: model.id,
          topic: formData.topic || undefined,
          hookType: formData.hookType || undefined,
          count: formData.count,
          saveToDb: formData.saveToDb,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setGenerateResult({
          success: false,
          error: data.error || data.details || "Failed to generate scripts",
        });
      } else {
        setGenerateResult({
          success: true,
          stats: data.stats,
        });
      }
    } catch (err) {
      setGenerateResult({
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const closeModal = () => {
    if (!isGenerating) {
      setIsModalOpen(false);
      setGenerateResult(null);
      setFormData({ topic: "", hookType: "", count: 3, saveToDb: true });
    }
  };

  const handleDelete = async () => {
    if (!model) return;
    const displayName = model.stage_name || model.name;
    
    if (!confirm(`Delete "${displayName}"? This will also delete all their scripts and cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/models/${model.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      // Redirect back to creators list
      router.push('/models');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete creator');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    async function loadModel() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setModel(data as unknown as Model);
      }
      setLoading(false);
    }
    loadModel();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
          <Link
            href="/models"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Creators
          </Link>
        </div>
        <SkeletonProfile />
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Creator Not Found</h2>
          <p className="text-zinc-500 mb-6">{error || "The creator you're looking for doesn't exist."}</p>
          <Link href="/models">
            <Button variant="secondary">Back to Creators</Button>
          </Link>
        </div>
      </div>
    );
  }

  const profile = model.voice_profile;
  const displayName = model.stage_name || model.name;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/models"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Creators
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={displayName} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">{displayName}</h1>
              {model.stage_name && model.name && (
                <p className="text-zinc-500">{model.name}</p>
              )}
              {profile?.identity?.quick_bio && (
                <p className="text-zinc-400 mt-1 max-w-lg">
                  {profile.identity.quick_bio}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={() => setIsModalOpen(true)}>
              <Sparkles className="w-4 h-4" />
              Generate Scripts
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </Button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex gap-3 mt-6 flex-wrap">
          {model.archetype_tags?.map((tag) => (
            <ArchetypeBadge key={tag} archetype={tag} />
          ))}
          <EnergyBadge level={profile?.personality?.energy_level} />
          <Badge variant="default" className="capitalize">
            {model.explicitness_level}
          </Badge>
        </div>
      </div>

      {/* Content Sections */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Identity */}
        <Section title="Identity" icon={User}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Field label="Name" value={profile?.identity?.name} />
            <Field label="Stage Name" value={profile?.identity?.stage_name} />
            <Field label="Location" value={profile?.identity?.origin_location} />
            <Field label="Age Range" value={profile?.identity?.age_range} />
          </div>
          {profile?.identity?.nicknames_fans_use?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <span className="text-zinc-500 text-sm">Fan Nicknames: </span>
              <span className="text-zinc-300">
                {profile.identity.nicknames_fans_use.join(", ")}
              </span>
            </div>
          )}
        </Section>

        {/* Voice Mechanics */}
        <Section title="Voice Mechanics" icon={MessageSquare}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <Field label="Sentence Style" value={profile?.voice_mechanics?.sentence_style} />
            <Field label="Avg Sentence Length" value={profile?.voice_mechanics?.avg_sentence_length} />
            <Field label="Question Frequency" value={profile?.voice_mechanics?.question_frequency} />
            <Field label="Swear Frequency" value={profile?.voice_mechanics?.swear_frequency} />
            <Field label="CTA Style" value={profile?.voice_mechanics?.cta_style} />
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <TagList
              label="Filler Words"
              items={profile?.voice_mechanics?.filler_words?.map((f) => `${f.word} (${f.frequency})`)}
              color="blue"
            />
            <TagList label="Sentence Starters" items={profile?.voice_mechanics?.sentence_starters} color="zinc" />
            <TagList label="Catchphrases" items={profile?.voice_mechanics?.catchphrases} color="yellow" />
            <TagList label="Swear Words" items={profile?.voice_mechanics?.swear_words} color="red" />
            <TagList label="Self-Interruption Patterns" items={profile?.voice_mechanics?.self_interruption_patterns} color="zinc" />
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Uses Caps:</span>{" "}
              <span className="text-zinc-300">{profile?.voice_mechanics?.emphasis_style?.uses_caps ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="text-zinc-500">Stretches Words:</span>{" "}
              <span className="text-zinc-300">{profile?.voice_mechanics?.emphasis_style?.stretches_words ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="text-zinc-500">Uses Repetition:</span>{" "}
              <span className="text-zinc-300">{profile?.voice_mechanics?.emphasis_style?.uses_repetition ? "Yes" : "No"}</span>
            </div>
          </div>
        </Section>

        {/* Personality */}
        <Section title="Personality" icon={Zap}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
            <Field label="Energy Level" value={profile?.personality?.energy_level} />
            <Field label="Humor Style" value={profile?.personality?.humor_style} />
            <Field label="Toxic Trait" value={profile?.personality?.toxic_trait} />
          </div>
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <TagList label="Self-Described Traits" items={profile?.personality?.self_described_traits} color="purple" />
            <TagList label="Friend-Described Traits" items={profile?.personality?.friend_described_traits} color="emerald" />
            <TagList label="Hot Takes" items={profile?.personality?.hot_takes} color="orange" />
          </div>
        </Section>

        {/* Content */}
        <Section title="Content" icon={Tag}>
          <Field label="Differentiator" value={profile?.content?.differentiator} />
          <div className="space-y-4 mt-4 pt-4 border-t border-zinc-800">
            <TagList label="Niche Topics" items={profile?.content?.niche_topics} color="blue" />
            <TagList label="Content Types" items={profile?.content?.content_types} color="zinc" />
            <TagList label="Can Talk Hours About" items={profile?.content?.can_talk_hours_about} color="emerald" />
            <TagList label="Strong Opinions On" items={profile?.content?.strong_opinions_on} color="orange" />
          </div>
        </Section>

        {/* Audience */}
        <Section title="Audience" icon={User}>
          <div className="space-y-3 text-sm">
            <Field label="Target Viewer" value={profile?.audience?.target_viewer_description} />
            <Field label="Fantasy Fulfilled" value={profile?.audience?.fantasy_fulfilled} />
            <Field label="How Fans Talk to Her" value={profile?.audience?.how_fans_talk_to_her} />
            <Field label="Best Performing Content" value={profile?.audience?.best_performing_content} />
          </div>
        </Section>

        {/* Spicy */}
        <Section title="Spicy" icon={Heart}>
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <Field label="Explicitness Level" value={profile?.spicy?.explicitness_level} />
            <Field label="Her Type" value={profile?.spicy?.her_type} />
          </div>
          <Field label="Flirting Style" value={profile?.spicy?.flirting_style} />
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <TagList label="Turn Ons Discussed" items={profile?.spicy?.turn_ons_discussed} color="pink" />
          </div>
        </Section>

        {/* Parasocial Levers */}
        <Section title="Parasocial Levers" icon={Shield}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-zinc-500 text-sm block mb-2">Strengths:</span>
              <div className="flex gap-2 flex-wrap">
                {profile?.parasocial?.strengths?.map((s) => (
                  <Badge key={s} variant="success">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-zinc-500 text-sm block mb-2">Avoid:</span>
              <div className="flex gap-2 flex-wrap">
                {profile?.parasocial?.avoid?.map((a) => (
                  <Badge key={a} variant="danger">{a}</Badge>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Sample Speech */}
        <Section title="Sample Speech" icon={Quote}>
          <div className="space-y-3">
            {profile?.sample_speech?.map((quote, i) => (
              <blockquote
                key={i}
                className="text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-4"
              >
                &quot;{quote}&quot;
              </blockquote>
            ))}
          </div>
        </Section>

        {/* Boundaries */}
        {(profile?.boundaries?.hard_nos?.length > 0 || profile?.boundaries?.topics_to_avoid?.length > 0) && (
          <Section title="Boundaries" icon={AlertTriangle} variant="danger">
            <div className="grid grid-cols-2 gap-6">
              {profile?.boundaries?.hard_nos?.length > 0 && (
                <div>
                  <span className="text-red-400 font-medium text-sm block mb-2">Hard Nos:</span>
                  <ul className="list-disc list-inside text-red-400/80 text-sm space-y-1">
                    {profile.boundaries.hard_nos.map((no, i) => (
                      <li key={i}>{no}</li>
                    ))}
                  </ul>
                </div>
              )}
              {profile?.boundaries?.topics_to_avoid?.length > 0 && (
                <div>
                  <span className="text-red-400 font-medium text-sm block mb-2">Topics to Avoid:</span>
                  <ul className="list-disc list-inside text-red-400/80 text-sm space-y-1">
                    {profile.boundaries.topics_to_avoid.map((topic, i) => (
                      <li key={i}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Archetype Assignment */}
        <Section title="Archetype Assignment" icon={Tag}>
          <div className="flex gap-3 items-center flex-wrap">
            <Badge variant="purple" className="text-sm px-3 py-1">
              {profile?.archetype_assignment?.primary}
            </Badge>
            {profile?.archetype_assignment?.secondary && (
              <Badge variant="default" className="text-sm px-3 py-1">
                {profile.archetype_assignment.secondary}
              </Badge>
            )}
            <span className="text-zinc-500 text-sm">
              {Math.round((profile?.archetype_assignment?.confidence || 0) * 100)}% confidence
            </span>
          </div>

          {/* Mix visualization */}
          {profile?.archetype_assignment?.mix && Object.keys(profile.archetype_assignment.mix).length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2">
              <span className="text-sm text-zinc-400">Archetype Mix:</span>
              <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800">
                {Object.entries(profile.archetype_assignment.mix).map(([archetype, pct], i) => (
                  <div
                    key={archetype}
                    className={`h-full ${i === 0 ? "bg-purple-500" : "bg-purple-400/60"}`}
                    style={{ width: `${(pct as number) * 100}%` }}
                    title={`${archetype}: ${Math.round((pct as number) * 100)}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                {Object.entries(profile.archetype_assignment.mix).map(([archetype, pct]) => (
                  <span key={archetype}>
                    {archetype.replace(/_/g, " ")}: {Math.round((pct as number) * 100)}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Metadata */}
        <div className="text-xs text-zinc-600 pt-6 border-t border-zinc-800">
          <p>Model ID: {model.id}</p>
          <p>Created: {new Date(model.created_at).toLocaleString()}</p>
          <p>Updated: {new Date(model.updated_at).toLocaleString()}</p>
        </div>
      </motion.div>

      {/* Generate Scripts Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Generate Scripts
              </h2>
              <button
                onClick={closeModal}
                disabled={isGenerating}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!generateResult ? (
                <>
                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Topic (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      placeholder="Leave blank for random"
                      disabled={isGenerating}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Hook Type */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Hook Type
                    </label>
                    <select
                      value={formData.hookType}
                      onChange={(e) => setFormData({ ...formData, hookType: e.target.value })}
                      disabled={isGenerating}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 disabled:opacity-50"
                    >
                      <option value="">All Types</option>
                      <option value="bold_statement">Bold Statement</option>
                      <option value="question">Question</option>
                      <option value="challenge">Challenge</option>
                      <option value="fantasy">Fantasy</option>
                      <option value="relatable">Relatable</option>
                      <option value="confession">Confession</option>
                      <option value="hot_take">Hot Take</option>
                      <option value="storytime">Storytime</option>
                    </select>
                  </div>

                  {/* Count */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Number of Scripts
                    </label>
                    <select
                      value={formData.count}
                      onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) })}
                      disabled={isGenerating}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 disabled:opacity-50"
                    >
                      <option value={1}>1 script</option>
                      <option value={2}>2 scripts</option>
                      <option value={3}>3 scripts</option>
                      <option value={5}>5 scripts</option>
                    </select>
                  </div>

                  {/* Save to DB */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="saveToDb"
                      checked={formData.saveToDb}
                      onChange={(e) => setFormData({ ...formData, saveToDb: e.target.checked })}
                      disabled={isGenerating}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-purple-500 focus:ring-purple-500/50 focus:ring-offset-0"
                    />
                    <label htmlFor="saveToDb" className="text-sm text-zinc-400">
                      Save scripts to database
                    </label>
                  </div>
                </>
              ) : generateResult.success ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    Scripts Generated!
                  </h3>
                  <div className="space-y-1 text-sm text-zinc-400 mb-4">
                    <p>Total: {generateResult.stats?.totalGenerated} scripts</p>
                    <p>Passed validation: {generateResult.stats?.passedValidation}</p>
                    <p>
                      Avg voice fidelity:{" "}
                      <span className={generateResult.stats?.avgVoiceFidelity && generateResult.stats.avgVoiceFidelity >= 0.8 ? "text-emerald-400" : "text-yellow-400"}>
                        {Math.round((generateResult.stats?.avgVoiceFidelity || 0) * 100)}%
                      </span>
                    </p>
                  </div>
                  <Link
                    href="/scripts"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    View Scripts
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                /* Error State */
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-100 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-sm text-red-400 mb-4">
                    {generateResult.error}
                  </p>
                  <button
                    onClick={() => setGenerateResult(null)}
                    className="text-sm text-zinc-400 hover:text-zinc-300"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {!generateResult && (
              <div className="flex gap-3 p-6 border-t border-zinc-800">
                <Button
                  variant="secondary"
                  onClick={closeModal}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerateScripts}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating {formData.count} scripts...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            )}

            {generateResult?.success && (
              <div className="p-6 border-t border-zinc-800">
                <Button variant="secondary" onClick={closeModal} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  icon: Icon,
  variant = "default",
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "danger";
}) {
  return (
    <Card className={variant === "danger" ? "border-red-500/20 bg-red-500/5" : ""}>
      <CardHeader>
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${variant === "danger" ? "text-red-400" : "text-zinc-100"}`}>
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </h2>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <span className="text-zinc-500">{label}:</span>{" "}
      <span className={value ? "text-zinc-200" : "text-zinc-600"}>{value || "—"}</span>
    </div>
  );
}

function TagList({
  label,
  items,
  color,
}: {
  label: string;
  items?: string[];
  color: "blue" | "zinc" | "yellow" | "red" | "emerald" | "purple" | "orange" | "pink";
}) {
  if (!items || items.length === 0) return null;

  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    zinc: "bg-zinc-800 text-zinc-400 border-zinc-700",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  };

  return (
    <div>
      <span className="text-zinc-500 text-sm">{label}: </span>
      <div className="flex gap-1.5 flex-wrap mt-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className={`px-2 py-0.5 rounded-lg text-xs border ${colorClasses[color]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function EnergyBadge({ level }: { level?: string }) {
  const config = {
    high: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
    medium: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
    low: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  };

  const { bg, border, text } = config[level as keyof typeof config] || config.medium;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${border} border`}>
      <Zap className={`w-3.5 h-3.5 ${text}`} />
      <span className={`text-xs font-medium ${text} capitalize`}>
        {level || "?"} energy
      </span>
    </div>
  );
}
