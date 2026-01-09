"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Users, Zap, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Model } from "@/lib/supabase/types";
import { Button, Card, ArchetypeBadge, Badge, Avatar, SkeletonCard } from "@/components/ui";

export default function ModelsPage() {
  const [models, setModels] = useState<Model[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadModels() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setModels(data as unknown as Model[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadModels();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will also delete all their scripts and cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/models/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      // Remove from local state
      setModels(prev => prev?.filter(m => m.id !== id) || null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete creator');
    } finally {
      setDeletingId(null);
    }
  }

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader count={0} />
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          Failed to load creators: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader count={models?.length || 0} />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !models || models.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence>
            {models.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ModelCard 
                  model={model} 
                  onDelete={handleDelete}
                  isDeleting={deletingId === model.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function PageHeader({ count }: { count: number }) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          Creators
        </h1>
        <p className="text-zinc-500 mt-1 ml-[52px]">
          {count} creator{count !== 1 ? "s" : ""} onboarded
        </p>
      </div>
      <Link href="/models/new">
        <Button>
          <Plus className="w-4 h-4" />
          Onboard Creator
        </Button>
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">No creators yet</h3>
      <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
        Onboard your first creator to start generating viral scripts tailored to their unique voice.
      </p>
      <Link href="/models/new">
        <Button size="lg">
          <Plus className="w-4 h-4" />
          Onboard Your First Creator
        </Button>
      </Link>
    </motion.div>
  );
}

interface ModelCardProps {
  model: Model;
  onDelete: (id: string, name: string) => void;
  isDeleting: boolean;
}

function ModelCard({ model, onDelete, isDeleting }: ModelCardProps) {
  const profile = model.voice_profile;
  const displayName = model.stage_name || model.name;

  return (
    <div className="relative group">
      {/* Delete button - appears on hover */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(model.id, displayName);
        }}
        disabled={isDeleting}
        className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500 
                   flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all
                   shadow-lg shadow-red-500/20 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete creator"
      >
        {isDeleting ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4 text-white" />
        )}
      </button>

      <Card href={`/models/${model.id}`} className="group/card">
        <div className="flex items-start gap-3 mb-4">
          <Avatar name={displayName} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-zinc-100 truncate group-hover/card:text-purple-400 transition-colors">
              {displayName}
            </h2>
            {model.stage_name && model.name && (
              <p className="text-sm text-zinc-500 truncate">{model.name}</p>
            )}
          </div>
          <EnergyBadge level={profile?.personality?.energy_level} />
        </div>

        {/* Archetypes */}
        {model.archetype_tags && model.archetype_tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {model.archetype_tags.slice(0, 3).map((tag) => (
              <ArchetypeBadge key={tag} archetype={tag} />
            ))}
            {model.archetype_tags.length > 3 && (
              <Badge variant="default">+{model.archetype_tags.length - 3}</Badge>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Explicitness</span>
            <span className="text-zinc-300 capitalize">
              {model.explicitness_level || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Swearing</span>
            <span className="text-zinc-300 capitalize">
              {profile?.voice_mechanics?.swear_frequency || "—"}
            </span>
          </div>
        </div>

        {/* Bio */}
        {profile?.identity?.quick_bio && (
          <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
            {profile.identity.quick_bio}
          </p>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800/50 flex justify-between items-center text-xs">
          <span className="text-zinc-500">
            Added {new Date(model.created_at).toLocaleDateString()}
          </span>
          <span className="text-purple-400 group-hover/card:text-purple-300 transition-colors flex items-center gap-1">
            View Profile
            <svg className="w-3 h-3 group-hover/card:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Card>
    </div>
  );
}

function EnergyBadge({ level }: { level?: string }) {
  const config = {
    high: { color: "from-orange-500 to-red-500", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
    medium: { color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
    low: { color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
  };

  const { bg, border, text } = config[level as keyof typeof config] || config.medium;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${bg} ${border} border`}>
      <Zap className={`w-3 h-3 ${text}`} />
      <span className={`text-xs font-medium ${text} capitalize`}>
        {level || "?"}
      </span>
    </div>
  );
}
