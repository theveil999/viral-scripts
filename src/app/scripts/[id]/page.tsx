"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  Send,
  Eye,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Script } from "@/lib/supabase/types";
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  SkeletonProfile,
} from "@/components/ui";

interface ScriptWithModel extends Script {
  models: {
    id: string;
    name: string;
    stage_name: string | null;
  } | null;
}

export default function ScriptDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [script, setScript] = useState<ScriptWithModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadScript() {
      try {
        const res = await fetch("/api/scripts/" + id);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load script");
        }
        const data = await res.json();
        setScript(data.script);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load script");
      } finally {
        setLoading(false);
      }
    }
    loadScript();
  }, [id]);

  const handleCopy = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleStatusUpdate = async (newStatus: "approved" | "posted" | "archived") => {
    if (!script || updating) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/scripts/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      const data = await res.json();
      setScript(data);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-8">
          <Link
            href="/scripts"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scripts
          </Link>
        </div>
        <SkeletonProfile />
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Script Not Found</h2>
          <p className="text-zinc-500 mb-6">{error || "The script you're looking for doesn't exist."}</p>
          <Link href="/scripts">
            <Button variant="secondary">Back to Scripts</Button>
          </Link>
        </div>
      </div>
    );
  }

  const modelName = script.models?.stage_name || script.models?.name || "Unknown Creator";
  const fidelityScore = script.voice_fidelity_score;
  const fidelityColor =
    fidelityScore === null
      ? "text-zinc-500"
      : fidelityScore >= 80
      ? "text-emerald-400"
      : fidelityScore >= 60
      ? "text-yellow-400"
      : "text-red-400";

  const fidelityBg =
    fidelityScore === null
      ? "from-zinc-600/20 to-zinc-700/20 border-zinc-600/30"
      : fidelityScore >= 80
      ? "from-emerald-500/20 to-teal-600/20 border-emerald-500/30"
      : fidelityScore >= 60
      ? "from-yellow-500/20 to-amber-600/20 border-yellow-500/30"
      : "from-red-500/20 to-rose-600/20 border-red-500/30";

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/scripts"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scripts
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={"/models/" + script.model_id}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium"
            >
              {modelName}
            </Link>
            <h1 className="text-2xl font-bold text-zinc-100 mt-1">
              {script.hook ? (script.hook.length > 80 ? script.hook.slice(0, 80) + "..." : script.hook) : "Script"}
            </h1>
          </div>
          <StatusBadge status={script.status} />
        </div>

        {/* Quick Stats */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {script.hook_type && <HookTypeBadge type={script.hook_type} />}
          {script.script_archetype && (
            <Badge variant="default">{script.script_archetype.replace(/_/g, " ")}</Badge>
          )}
          {script.validation_passed ? (
            <Badge variant="success">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Validation Passed
            </Badge>
          ) : (
            <Badge variant="danger">
              <XCircle className="w-3 h-3 mr-1" />
              Validation Failed
            </Badge>
          )}
        </div>
      </div>


      {/* Content */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Voice Fidelity Score */}
        <div className={"p-6 rounded-xl bg-gradient-to-br border " + fidelityBg}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-zinc-400 text-sm">Voice Fidelity Score</span>
              <div className={"text-4xl font-bold mt-1 " + fidelityColor}>
                {fidelityScore !== null ? Math.round(fidelityScore) + "%" : "—"}
              </div>
            </div>
            <Sparkles className={"w-12 h-12 opacity-50 " + fidelityColor} />
          </div>
          {fidelityScore !== null && fidelityScore < 85 && (
            <p className="text-sm text-zinc-500 mt-2">
              Below 85% threshold. Consider regenerating for better voice match.
            </p>
          )}
        </div>

        {/* Hook */}
        {script.hook && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-zinc-100">Hook</h2>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 text-lg italic">"{script.hook}"</p>
            </CardContent>
          </Card>
        )}

        {/* Full Script Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Script Content
              </h2>
              <Button
                variant={copied ? "secondary" : "primary"}
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Script
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800">
              <p className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {script.content}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Parasocial Levers */}
        {script.parasocial_levers && script.parasocial_levers.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-zinc-100">Parasocial Levers</h2>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {script.parasocial_levers.map((lever) => (
                  <Badge key={lever} variant="purple">
                    {lever.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-100">Details</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-zinc-500">Duration</span>
                <p className="text-zinc-200 font-medium">
                  {script.duration_seconds ? script.duration_seconds + "s" : "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Word Count</span>
                <p className="text-zinc-200 font-medium">
                  {script.word_count || "—"}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Created</span>
                <p className="text-zinc-200 font-medium">
                  {new Date(script.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Status</span>
                <p className="text-zinc-200 font-medium capitalize">
                  {script.status}
                </p>
              </div>
            </div>
            {(script.approved_at || script.posted_at) && (
              <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4 text-sm">
                {script.approved_at && (
                  <div>
                    <span className="text-zinc-500">Approved</span>
                    <p className="text-zinc-200 font-medium">
                      {new Date(script.approved_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {script.posted_at && (
                  <div>
                    <span className="text-zinc-500">Posted</span>
                    <p className="text-zinc-200 font-medium">
                      {new Date(script.posted_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap pt-4">
          {script.status === "draft" && (
            <Button
              onClick={() => handleStatusUpdate("approved")}
              disabled={updating}
            >
              <Send className="w-4 h-4" />
              Approve
            </Button>
          )}
          {(script.status === "draft" || script.status === "approved") && (
            <Button
              variant={script.status === "approved" ? "primary" : "secondary"}
              onClick={() => handleStatusUpdate("posted")}
              disabled={updating}
            >
              <Eye className="w-4 h-4" />
              Mark as Posted
            </Button>
          )}
          {script.status === "posted" && (
            <Button
              onClick={() => handleStatusUpdate("archived")}
              disabled={updating}
            >
              <TrendingUp className="w-4 h-4" />
              Archive
            </Button>
          )}
          <Link href={"/models/" + script.model_id}>
            <Button variant="ghost">View Creator Profile</Button>
          </Link>
        </div>

        {/* Script ID */}
        <div className="text-xs text-zinc-600 pt-4 border-t border-zinc-800">
          <p>Script ID: {script.id}</p>
        </div>
      </motion.div>
    </div>
  );
}


function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: typeof Clock }> = {
    draft: { color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30", icon: Clock },
    sent: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Send },
    posted: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: Eye },
    tracked: { color: "bg-orange-500/20 text-orange-300 border-orange-500/30", icon: TrendingUp },
  };

  const StatusIcon = config[status]?.icon || Clock;
  const colorClass = config[status]?.color || config.draft.color;

  return (
    <div className={"flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium " + colorClass}>
      <StatusIcon className="w-4 h-4" />
      <span className="capitalize">{status}</span>
    </div>
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
    <Badge variant={colors[type] || "default"}>
      {type.replace(/_/g, " ")}
    </Badge>
  );
}
