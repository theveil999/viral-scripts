"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { 
  FileText, 
  Sparkles, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  Eye,
  TrendingUp,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Script, Model } from "@/lib/supabase/types";
import { Button, Badge, SkeletonCard } from "@/components/ui";

// Extended script type with joined model data
interface ScriptWithModel extends Script {
  models: {
    id: string;
    name: string;
    stage_name: string | null;
  } | null;
}

type SortOption = "newest" | "oldest" | "highest_fidelity" | "lowest_fidelity";
type StatusFilter = "all" | "draft" | "sent" | "posted" | "tracked";
type ValidationFilter = "all" | "passed" | "failed";

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<ScriptWithModel[] | null>(null);
  const [models, setModels] = useState<Pick<Model, "id" | "name" | "stage_name">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Dropdown visibility
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Fetch scripts with model info
      const { data: scriptsData, error: scriptsError } = await supabase
        .from("scripts")
        .select(`
          id,
          content,
          hook,
          hook_type,
          script_archetype,
          parasocial_levers,
          word_count,
          duration_estimate,
          voice_fidelity_score,
          validation_passed,
          status,
          created_at,
          model_id,
          models (
            id,
            name,
            stage_name
          )
        `)
        .order("created_at", { ascending: false });

      if (scriptsError) {
        setError(scriptsError.message);
        setLoading(false);
        return;
      }

      // Fetch models for filter dropdown
      const { data: modelsData } = await supabase
        .from("models")
        .select("id, name, stage_name")
        .order("name");

      setScripts(scriptsData as unknown as ScriptWithModel[]);
      setModels(modelsData || []);
      setLoading(false);
    }

    loadData();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowModelDropdown(false);
        setShowStatusDropdown(false);
        setShowSortDropdown(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Filter and sort scripts
  const filteredScripts = useMemo(() => {
    if (!scripts) return [];

    let filtered = [...scripts];

    // Model filter
    if (modelFilter !== "all") {
      filtered = filtered.filter((s) => s.model_id === modelFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Validation filter
    if (validationFilter !== "all") {
      const passed = validationFilter === "passed";
      filtered = filtered.filter((s) => s.validation_passed === passed);
    }

    // Sort
    switch (sortBy) {
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "highest_fidelity":
        filtered.sort((a, b) => (b.voice_fidelity_score || 0) - (a.voice_fidelity_score || 0));
        break;
      case "lowest_fidelity":
        filtered.sort((a, b) => (a.voice_fidelity_score || 0) - (b.voice_fidelity_score || 0));
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [scripts, modelFilter, statusFilter, validationFilter, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!scripts || scripts.length === 0) {
      return {
        total: 0,
        draft: 0,
        approved: 0,
        posted: 0,
        archived: 0,
        avgFidelity: 0,
      };
    }

    const fidelityScores = scripts
      .filter((s) => s.voice_fidelity_score !== null)
      .map((s) => s.voice_fidelity_score as number);

    return {
      total: scripts.length,
      draft: scripts.filter((s) => s.status === "draft").length,
      approved: scripts.filter((s) => s.status === "approved").length,
      posted: scripts.filter((s) => s.status === "posted").length,
      archived: scripts.filter((s) => s.status === "archived").length,
      avgFidelity: fidelityScores.length > 0
        ? Math.round(fidelityScores.reduce((a, b) => a + b, 0) / fidelityScores.length)
        : 0,
    };
  }, [scripts]);

  if (error) {
    return (
      <div className="animate-fade-in">
        <PageHeader />
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          Failed to load scripts: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader />

      {/* Stats Summary */}
      {!loading && scripts && scripts.length > 0 && (
        <StatsBar stats={stats} />
      )}

      {/* Filters */}
      {!loading && scripts && scripts.length > 0 && (
        <FilterBar
          models={models}
          modelFilter={modelFilter}
          setModelFilter={setModelFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          validationFilter={validationFilter}
          setValidationFilter={setValidationFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showModelDropdown={showModelDropdown}
          setShowModelDropdown={setShowModelDropdown}
          showStatusDropdown={showStatusDropdown}
          setShowStatusDropdown={setShowStatusDropdown}
          showSortDropdown={showSortDropdown}
          setShowSortDropdown={setShowSortDropdown}
          filteredCount={filteredScripts.length}
          totalCount={scripts.length}
        />
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !scripts || scripts.length === 0 ? (
        <EmptyState />
      ) : filteredScripts.length === 0 ? (
        <NoResultsState onClear={() => {
          setModelFilter("all");
          setStatusFilter("all");
          setValidationFilter("all");
        }} />
      ) : (
        <motion.div
          className="grid gap-4 md:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredScripts.map((script, index) => (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                layout
              >
                <ScriptCard script={script} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}


function PageHeader() {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-400" />
          </div>
          Generated Scripts
        </h1>
        <p className="text-zinc-500 mt-1 ml-[52px]">
          View and manage all generated scripts
        </p>
      </div>
    </div>
  );
}

interface StatsBarProps {
  stats: {
    total: number;
    draft: number;
    approved: number;
    posted: number;
    archived: number;
    avgFidelity: number;
  };
}

function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      <StatCard
        label="Total Scripts"
        value={stats.total}
        icon={<FileText className="w-4 h-4" />}
        color="purple"
      />
      <StatCard
        label="Draft"
        value={stats.draft}
        icon={<Clock className="w-4 h-4" />}
        color="zinc"
      />
      <StatCard
        label="Approved"
        value={stats.approved}
        icon={<Send className="w-4 h-4" />}
        color="blue"
      />
      <StatCard
        label="Posted"
        value={stats.posted}
        icon={<Eye className="w-4 h-4" />}
        color="emerald"
      />
      <StatCard
        label="Archived"
        value={stats.archived}
        icon={<TrendingUp className="w-4 h-4" />}
        color="orange"
      />
      <StatCard
        label="Avg Fidelity"
        value={`${stats.avgFidelity}%`}
        icon={<Sparkles className="w-4 h-4" />}
        color={stats.avgFidelity >= 80 ? "emerald" : stats.avgFidelity >= 60 ? "yellow" : "red"}
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "purple" | "zinc" | "blue" | "emerald" | "orange" | "yellow" | "red";
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorMap: Record<string, string> = {
    purple: "from-purple-500/20 to-violet-600/20 border-purple-500/30 text-purple-400",
    zinc: "from-zinc-600/20 to-zinc-700/20 border-zinc-600/30 text-zinc-400",
    blue: "from-blue-500/20 to-cyan-600/20 border-blue-500/30 text-blue-400",
    emerald: "from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-400",
    orange: "from-orange-500/20 to-amber-600/20 border-orange-500/30 text-orange-400",
    yellow: "from-yellow-500/20 to-amber-600/20 border-yellow-500/30 text-yellow-400",
    red: "from-red-500/20 to-rose-600/20 border-red-500/30 text-red-400",
  };

  const styles = colorMap[color] || colorMap.purple;

  return (
    <div className={`p-3 rounded-xl bg-gradient-to-br ${styles} border`}>
      <div className="flex items-center gap-2 text-zinc-400">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold text-zinc-100 mt-1">{value}</div>
    </div>
  );
}


interface FilterBarProps {
  models: Pick<Model, "id" | "name" | "stage_name">[];
  modelFilter: string;
  setModelFilter: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  validationFilter: ValidationFilter;
  setValidationFilter: (v: ValidationFilter) => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
  showModelDropdown: boolean;
  setShowModelDropdown: (v: boolean) => void;
  showStatusDropdown: boolean;
  setShowStatusDropdown: (v: boolean) => void;
  showSortDropdown: boolean;
  setShowSortDropdown: (v: boolean) => void;
  filteredCount: number;
  totalCount: number;
}

function FilterBar({
  models,
  modelFilter,
  setModelFilter,
  statusFilter,
  setStatusFilter,
  validationFilter,
  setValidationFilter,
  sortBy,
  setSortBy,
  showModelDropdown,
  setShowModelDropdown,
  showStatusDropdown,
  setShowStatusDropdown,
  showSortDropdown,
  setShowSortDropdown,
  filteredCount,
  totalCount,
}: FilterBarProps) {
  const selectedModel = models.find((m) => m.id === modelFilter);
  const modelLabel = selectedModel
    ? selectedModel.stage_name || selectedModel.name
    : "All Creators";

  const statusLabels: Record<StatusFilter, string> = {
    all: "All Status",
    draft: "Draft",
    sent: "Sent",
    posted: "Posted",
    tracked: "Tracked",
  };

  const sortLabels: Record<SortOption, string> = {
    newest: "Newest First",
    oldest: "Oldest First",
    highest_fidelity: "Highest Fidelity",
    lowest_fidelity: "Lowest Fidelity",
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <Filter className="w-4 h-4 text-zinc-500" />

      {/* Model Filter */}
      <div className="relative" data-dropdown>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowModelDropdown(!showModelDropdown);
            setShowStatusDropdown(false);
            setShowSortDropdown(false);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          {modelLabel}
          <ChevronDown className="w-4 h-4" />
        </button>
        {showModelDropdown && (
          <div className="absolute top-full left-0 mt-1 w-48 py-1 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl z-10 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                setModelFilter("all");
                setShowModelDropdown(false);
              }}
              className={"w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 transition-colors " + (modelFilter === "all" ? "text-purple-400 bg-purple-500/10" : "text-zinc-300")}
            >
              All Creators
            </button>
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  setModelFilter(model.id);
                  setShowModelDropdown(false);
                }}
                className={"w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 transition-colors " + (modelFilter === model.id ? "text-purple-400 bg-purple-500/10" : "text-zinc-300")}
              >
                {model.stage_name || model.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div className="relative" data-dropdown>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowStatusDropdown(!showStatusDropdown);
            setShowModelDropdown(false);
            setShowSortDropdown(false);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          {statusLabels[statusFilter]}
          <ChevronDown className="w-4 h-4" />
        </button>
        {showStatusDropdown && (
          <div className="absolute top-full left-0 mt-1 w-36 py-1 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl z-10">
            {(["all", "draft", "sent", "posted", "tracked"] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setShowStatusDropdown(false);
                }}
                className={"w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 transition-colors " + (statusFilter === status ? "text-purple-400 bg-purple-500/10" : "text-zinc-300")}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Validation Filter */}
      <div className="flex gap-1.5">
        {(["all", "passed", "failed"] as ValidationFilter[]).map((v) => {
          let btnClass = "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ";
          if (validationFilter === v) {
            if (v === "passed") {
              btnClass += "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
            } else if (v === "failed") {
              btnClass += "bg-red-500/20 text-red-300 border border-red-500/30";
            } else {
              btnClass += "bg-purple-500/20 text-purple-300 border border-purple-500/30";
            }
          } else {
            btnClass += "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600";
          }
          return (
            <button
              key={v}
              onClick={() => setValidationFilter(v)}
              className={btnClass}
            >
              {v === "all" ? "All" : v === "passed" ? "Passed" : "Failed"}
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <div className="relative ml-auto" data-dropdown>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSortDropdown(!showSortDropdown);
            setShowModelDropdown(false);
            setShowStatusDropdown(false);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
          {sortLabels[sortBy]}
          <ChevronDown className="w-4 h-4" />
        </button>
        {showSortDropdown && (
          <div className="absolute top-full right-0 mt-1 w-44 py-1 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl z-10">
            {(["newest", "oldest", "highest_fidelity", "lowest_fidelity"] as SortOption[]).map((option) => (
              <button
                key={option}
                onClick={() => {
                  setSortBy(option);
                  setShowSortDropdown(false);
                }}
                className={"w-full px-3 py-2 text-left text-sm hover:bg-zinc-700 transition-colors " + (sortBy === option ? "text-purple-400 bg-purple-500/10" : "text-zinc-300")}
              >
                {sortLabels[option]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {filteredCount !== totalCount && (
        <span className="text-xs text-zinc-500">
          Showing {filteredCount} of {totalCount}
        </span>
      )}
    </div>
  );
}


function ScriptCard({ script }: { script: ScriptWithModel }) {
  const router = useRouter();
  const modelName = script.models?.stage_name || script.models?.name || "Unknown";
  const hookPreview = script.hook
    ? script.hook.length > 60
      ? script.hook.slice(0, 60) + "..."
      : script.hook
    : "No hook";

  const fidelityScore = script.voice_fidelity_score;
  const fidelityColor =
    fidelityScore === null
      ? "text-zinc-500"
      : fidelityScore >= 80
      ? "text-emerald-400"
      : fidelityScore >= 60
      ? "text-yellow-400"
      : "text-red-400";

  const statusConfig: Record<string, { color: string; icon: typeof Clock }> = {
    draft: { color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30", icon: Clock },
    sent: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Send },
    posted: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: Eye },
    tracked: { color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: TrendingUp },
  };
  const StatusIcon = statusConfig[script.status]?.icon || Clock;
  const statusColor = statusConfig[script.status]?.color || statusConfig.draft.color;

  return (
    <Link
      href={"/scripts/" + script.id}
      className="block p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push("/models/" + script.model_id);
            }}
            className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors text-left"
          >
            {modelName}
          </button>
          <p className="text-zinc-300 mt-1 line-clamp-2 group-hover:text-zinc-200 transition-colors">
            {hookPreview}
          </p>
        </div>
        <div className={"flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium " + statusColor}>
          <StatusIcon className="w-3 h-3" />
          <span className="capitalize">{script.status}</span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {script.hook_type && (
          <HookTypeBadge type={script.hook_type} />
        )}
        {script.script_archetype && (
          <Badge variant="default" size="sm">
            {script.script_archetype.replace(/_/g, " ")}
          </Badge>
        )}
        {script.validation_passed ? (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Passed
          </Badge>
        ) : (
          <Badge variant="danger" size="sm">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs border-t border-zinc-800/50 pt-3">
        <div className="flex items-center gap-4">
          {script.duration_seconds && (
            <span className="text-zinc-500">
              {script.duration_seconds}s
            </span>
          )}
          {script.word_count && (
            <span className="text-zinc-500">
              {script.word_count} words
            </span>
          )}
          <span className={"font-medium " + fidelityColor}>
            {fidelityScore !== null ? Math.round(fidelityScore) + "%" : "—"} fidelity
          </span>
        </div>
        <span className="text-zinc-500">
          {formatRelativeTime(script.created_at)}
        </span>
      </div>
    </Link>
  );
}

function HookTypeBadge({ type }: { type: string }) {
  const colors: Record<string, "purple" | "blue" | "green" | "yellow" | "red" | "pink" | "orange" | "cyan"> = {
    bold_statement: "purple",
    question: "blue",
    challenge: "orange",
    fantasy: "pink",
    relatable: "green",
    advice: "cyan",
    confession: "red",
    roleplay: "yellow",
    storytime: "blue",
    hot_take: "orange",
  };

  return (
    <Badge variant={colors[type] || "default"} size="sm">
      {type.replace(/_/g, " ")}
    </Badge>
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
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-8 h-8 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">No scripts generated yet</h3>
      <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
        Select a creator and generate your first batch of viral scripts.
      </p>
      <Link href="/models">
        <Button size="lg">
          <FileText className="w-4 h-4" />
          View Creators
        </Button>
      </Link>
    </motion.div>
  );
}

function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Filter className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-zinc-200 mb-2">No scripts match filters</h3>
      <p className="text-zinc-500 mb-6">
        Try adjusting your filters to see more results.
      </p>
      <Button variant="secondary" onClick={onClear}>
        Clear Filters
      </Button>
    </motion.div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return diffMins + "m ago";
  if (diffHours < 24) return diffHours + "h ago";
  if (diffDays < 7) return diffDays + "d ago";
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
