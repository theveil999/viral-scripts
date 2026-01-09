"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  Database,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, CardHeader, CardContent, Badge } from "@/components/ui";

interface Stats {
  models: number;
  scripts: number;
  corpus: number;
  corpusWithEmbeddings: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({ models: 0, scripts: 0, corpus: 0, corpusWithEmbeddings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const supabase = createClient();
      const [modelsResult, scriptsResult, corpusResult, corpusEmbeddingsResult] = await Promise.all([
        supabase.from("models").select("id", { count: "exact", head: true }),
        supabase.from("scripts").select("id", { count: "exact", head: true }),
        supabase.from("corpus").select("id", { count: "exact", head: true }),
        supabase.from("corpus").select("id", { count: "exact", head: true }).not("embedding", "is", null),
      ]);

      setStats({
        models: modelsResult.count || 0,
        scripts: scriptsResult.count || 0,
        corpus: corpusResult.count || 0,
        corpusWithEmbeddings: corpusEmbeddingsResult.count || 0,
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            Viral Scripts
          </h1>
          <p className="text-zinc-500 mt-2 ml-[60px]">
            Generate voice-matched scripts for content creators
          </p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <StatCard
          label="Creators"
          value={stats.models}
          icon={Users}
          href="/models"
          loading={loading}
          color="purple"
        />
        <StatCard
          label="Scripts"
          value={stats.scripts}
          icon={FileText}
          loading={loading}
          color="blue"
        />
        <StatCard
          label="Corpus"
          value={stats.corpus}
          icon={Database}
          loading={loading}
          color="emerald"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Link href="/models/new">
          <Card className="group cursor-pointer bg-gradient-to-br from-purple-500/10 to-violet-600/10 border-purple-500/20 hover:border-purple-500/40">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-lg">Onboard Creator</h3>
                  <p className="text-zinc-500 text-sm">
                    Extract voice profile from interview
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/models">
          <Card className="group cursor-pointer hover:border-zinc-700">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                  <Users className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-100 text-lg">View Creators</h3>
                  <p className="text-zinc-500 text-sm">
                    Manage onboarded creators
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-zinc-100">System Status</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusRow label="Database" status="connected" />
            <StatusRow label="Claude API" status="connected" />
            <StatusRow
              label="Corpus Embeddings"
              status={
                loading
                  ? "pending"
                  : stats.corpusWithEmbeddings === stats.corpus && stats.corpus > 0
                  ? "connected"
                  : stats.corpusWithEmbeddings > 0
                  ? "pending"
                  : "error"
              }
              note={
                loading
                  ? "Checking..."
                  : stats.corpusWithEmbeddings === stats.corpus && stats.corpus > 0
                  ? `${stats.corpusWithEmbeddings}/${stats.corpus} ready`
                  : stats.corpusWithEmbeddings > 0
                  ? `${stats.corpusWithEmbeddings}/${stats.corpus} embedded`
                  : "Run npm run generate-embeddings"
              }
            />
            <StatusRow
              label="n8n Workflows"
              status="pending"
              note="Documented, needs implementation"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Pipeline Overview */}
      <motion.div
        className="mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-zinc-100">6-Stage AI Pipeline</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <PipelineStage number={1} name="Corpus Retrieval" model="Supabase" />
              <PipelineStage number={2} name="Hook Generation" model="Sonnet" />
              <PipelineStage number={3} name="Script Expansion" model="Sonnet" />
              <PipelineStage number={4} name="Voice Transform" model="Opus" critical />
              <PipelineStage number={5} name="Validation" model="Haiku" />
              <PipelineStage number={6} name="Output" model="Supabase" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  loading,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  loading?: boolean;
  color: "purple" | "blue" | "emerald";
}) {
  const colorClasses = {
    purple: {
      bg: "bg-purple-500/10",
      border: "border-purple-500/20 hover:border-purple-500/40",
      icon: "text-purple-400",
      value: "text-purple-400",
    },
    blue: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20 hover:border-blue-500/40",
      icon: "text-blue-400",
      value: "text-blue-400",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      icon: "text-emerald-400",
      value: "text-emerald-400",
    },
  };

  const { bg, border, icon, value: valueColor } = colorClasses[color];

  const content = (
    <Card className={`${border} ${href ? "cursor-pointer" : ""}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${icon}`} />
          </div>
          {href && <ArrowRight className="w-4 h-4 text-zinc-600" />}
        </div>
        <div className={`text-3xl font-bold ${valueColor}`}>
          {loading ? (
            <div className="w-12 h-8 bg-zinc-800 rounded animate-pulse" />
          ) : (
            value.toLocaleString()
          )}
        </div>
        <div className="text-zinc-500 text-sm mt-1">{label}</div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function StatusRow({
  label,
  status,
  note,
}: {
  label: string;
  status: "connected" | "pending" | "error";
  note?: string;
}) {
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500",
    },
    pending: {
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500",
    },
    error: {
      icon: AlertCircle,
      color: "text-red-400",
      bg: "bg-red-500",
    },
  };

  const { icon: Icon, color, bg } = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${bg}`} />
        <span className="text-zinc-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {note && <span className="text-zinc-600 text-sm">{note}</span>}
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
    </div>
  );
}

function PipelineStage({
  number,
  name,
  model,
  critical = false,
}: {
  number: number;
  name: string;
  model: string;
  critical?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
        critical
          ? "bg-purple-500/10 border-purple-500/20"
          : "bg-zinc-800/50 border-zinc-700/50"
      }`}
    >
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          critical
            ? "bg-purple-500 text-white"
            : "bg-zinc-700 text-zinc-300"
        }`}
      >
        {number}
      </span>
      <div>
        <div className={`font-medium text-sm ${critical ? "text-purple-300" : "text-zinc-200"}`}>
          {name}
        </div>
        <div className="text-xs text-zinc-500">{model}</div>
      </div>
    </div>
  );
}
