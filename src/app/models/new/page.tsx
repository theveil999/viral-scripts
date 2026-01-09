"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileText,
  Sparkles,
  Check,
  AlertCircle,
  User,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardContent,
  Progress,
  Badge,
  ArchetypeBadge,
  FileDropzone,
  showToast,
} from "@/components/ui";
import {
  parseTranscriptFile,
  autoFormatTranscript,
  extractSpeakersFromTranscript,
  parseTranscriptWithSpeakers,
  INTERVIEWER_NAME,
  type SpeakerInfo,
} from "@/lib/utils/parse-transcript";
import type { ExtractedVoiceProfile } from "@/lib/services/profile-extraction";

const VALID_ARCHETYPES = [
  "girl_next_door",
  "bratty_princess",
  "gym_baddie",
  "alt_egirl",
  "classy_mysterious",
  "party_girl",
  "nerdy_gamer_girl",
  "spicy_latina",
  "southern_belle",
  "cool_girl",
  "chaotic_unhinged",
  "soft_sensual",
  "dominant",
] as const;

const STEPS = [
  { id: 1, label: "Basic Info", icon: User },
  { id: 2, label: "Transcript", icon: FileText },
  { id: 3, label: "Extract", icon: Sparkles },
  { id: 4, label: "Review", icon: Check },
];

type WizardStep = 1 | 2 | 3 | 4;
type ExtractionState = "idle" | "extracting" | "success" | "error";

export default function NewModelPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);

  // Form data
  const [name, setName] = useState("");
  const [stageName, setStageName] = useState("");
  const [transcript, setTranscript] = useState("");

  // Speaker detection state
  const [speakerInfo, setSpeakerInfo] = useState<SpeakerInfo | null>(null);
  const [selectedModelSpeaker, setSelectedModelSpeaker] = useState<string | null>(null);
  const [detectedModelName, setDetectedModelName] = useState<string | null>(null);

  // Extraction state
  const [extractionState, setExtractionState] = useState<ExtractionState>("idle");
  const [extractedProfile, setExtractedProfile] = useState<ExtractedVoiceProfile | null>(null);
  const [archetypeTags, setArchetypeTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // UI state
  const [showAllQuotes, setShowAllQuotes] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle speaker detection from transcript
  const handleSpeakerDetection = (text: string) => {
    const info = extractSpeakersFromTranscript(text);
    setSpeakerInfo(info);

    if (info.model && !info.hasMultipleModels) {
      setDetectedModelName(info.model);
      setSelectedModelSpeaker(info.model);
      // Only auto-fill if name is empty
      if (!name && !stageName) {
        setName(info.model);
        showToast(`Detected creator: ${info.model}`, "success");
      }
    } else if (info.hasMultipleModels) {
      showToast("Multiple speakers detected - please select the creator", "info");
    } else if (info.error) {
      if (info.error.includes("only interviewer")) {
        showToast("Only interviewer found - no model detected", "error");
      }
    }
  };

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    try {
      const content = await file.text();
      const result = parseTranscriptWithSpeakers(content, file.name);
      setTranscript(result.formatted);
      setSpeakerInfo(result.speakerInfo);

      if (result.modelName && !result.speakerInfo.hasMultipleModels) {
        setDetectedModelName(result.modelName);
        setSelectedModelSpeaker(result.modelName);
        if (!name && !stageName) {
          setName(result.modelName);
          showToast(`Detected creator: ${result.modelName}`, "success");
        }
      } else if (result.speakerInfo.hasMultipleModels) {
        showToast("Multiple speakers detected - please select the creator", "info");
      }
    } catch (err) {
      setError("Failed to parse transcript file");
      setSelectedFile(null);
    }
  };

  // Handle model speaker selection (for multiple speakers case)
  const handleModelSelection = (speakerName: string) => {
    setSelectedModelSpeaker(speakerName);
    setDetectedModelName(speakerName);
    if (!name && !stageName) {
      setName(speakerName);
    }
    showToast(`Selected creator: ${speakerName}`, "success");
  };

  const handleExtract = async () => {
    setExtractionState("extracting");
    setError(null);

    // Determine which speaker is the model
    const modelName = selectedModelSpeaker || detectedModelName || name || stageName;

    try {
      const response = await fetch("/api/models/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          modelName, // Pass model name for focused extraction
          interviewerName: INTERVIEWER_NAME,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to extract profile");
      }

      setExtractedProfile(data.voice_profile);
      const tags = [
        data.voice_profile.archetype_assignment?.primary,
        data.voice_profile.archetype_assignment?.secondary,
      ].filter(Boolean) as string[];
      setArchetypeTags(tags);
      setExtractionState("success");
      setStep(4);
    } catch (err) {
      setExtractionState("error");
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const handleSave = async () => {
    if (!extractedProfile) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          stage_name: stageName.trim() || undefined,
          transcript,
          voice_profile: extractedProfile,
          archetype_tags: archetypeTags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save model");
      }

      router.push(`/models/${data.model.id}`);
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const toggleArchetype = (archetype: string) => {
    setArchetypeTags((prev) =>
      prev.includes(archetype)
        ? prev.filter((t) => t !== archetype)
        : [...prev, archetype]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return name.trim() || stageName.trim();
      case 2:
        // Need transcript and valid speaker selection
        if (transcript.trim().length < 100) return false;

        // If we have speaker info with errors (only interviewer, no speakers), block
        if (speakerInfo?.error) return false;

        // If multiple models detected, require selection
        if (speakerInfo?.hasMultipleModels && !selectedModelSpeaker) return false;

        return true;
      case 3:
        return extractionState === "success";
      default:
        return true;
    }
  };

  const goNext = () => {
    if (step === 2 && extractionState !== "success") {
      setStep(3);
      handleExtract();
    } else if (step < 4) {
      setStep((step + 1) as WizardStep);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep((step - 1) as WizardStep);
      if (step === 3) {
        setExtractionState("idle");
      }
    }
  };

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
        <h1 className="text-2xl font-bold text-zinc-100">Onboard New Creator</h1>
        <p className="text-zinc-500 mt-1">
          Extract a unique voice profile from an interview transcript
        </p>
      </div>

      {/* Progress Steps */}
      <Progress steps={STEPS} currentStep={step} className="mb-8" />

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && (
            <StepBasicInfo
              name={name}
              setName={setName}
              stageName={stageName}
              setStageName={setStageName}
            />
          )}

          {step === 2 && (
            <StepTranscript
              transcript={transcript}
              setTranscript={setTranscript}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              onFileSelect={handleFileSelect}
              speakerInfo={speakerInfo}
              selectedModelSpeaker={selectedModelSpeaker}
              onModelSelection={handleModelSelection}
              onSpeakerDetection={handleSpeakerDetection}
            />
          )}

          {step === 3 && (
            <StepExtraction
              state={extractionState}
              error={error}
              onRetry={handleExtract}
            />
          )}

          {step === 4 && extractedProfile && (
            <StepReview
              profile={extractedProfile}
              archetypeTags={archetypeTags}
              toggleArchetype={toggleArchetype}
              showAllQuotes={showAllQuotes}
              setShowAllQuotes={setShowAllQuotes}
              displayName={stageName || name || extractedProfile.identity?.stage_name || extractedProfile.identity?.name || "Unknown"}
              error={error}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Display */}
      {error && step !== 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400/80 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-800">
        <Button
          variant="ghost"
          onClick={goBack}
          disabled={step === 1 || (step === 3 && extractionState === "extracting")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        {step === 4 ? (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Spinner />
                Saving Creator...
              </>
            ) : (
              <>
                Save Creator
                <Check className="w-4 h-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={goNext}
            disabled={!canProceed() || (step === 3 && extractionState === "extracting")}
          >
            {step === 2 ? "Extract Profile" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepBasicInfo({
  name,
  setName,
  stageName,
  setStageName,
}: {
  name: string;
  setName: (v: string) => void;
  stageName: string;
  setStageName: (v: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-zinc-100">Creator Information</h2>
        <p className="text-sm text-zinc-500">Enter the creator&apos;s name and optional stage name</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          label="Real Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Jessica Smith"
          hint="The creator's actual name (kept private)"
        />
        <Input
          label="Stage Name"
          value={stageName}
          onChange={(e) => setStageName(e.target.value)}
          placeholder="e.g., JessyBaby"
          hint="The public-facing creator name (optional)"
        />
      </CardContent>
    </Card>
  );
}

function StepTranscript({
  transcript,
  setTranscript,
  selectedFile,
  setSelectedFile,
  onFileSelect,
  speakerInfo,
  selectedModelSpeaker,
  onModelSelection,
  onSpeakerDetection,
}: {
  transcript: string;
  setTranscript: (v: string) => void;
  selectedFile: File | null;
  setSelectedFile: (f: File | null) => void;
  onFileSelect: (file: File) => Promise<void>;
  speakerInfo: SpeakerInfo | null;
  selectedModelSpeaker: string | null;
  onModelSelection: (name: string) => void;
  onSpeakerDetection: (text: string) => void;
}) {
  const [inputMode, setInputMode] = useState<"paste" | "upload">("paste");

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const { formatted, wasFormatted, speakerInfo: pastedSpeakerInfo } = autoFormatTranscript(pastedText);

    if (wasFormatted) {
      e.preventDefault();
      setTranscript(formatted);
      showToast("Formatted transcript for readability", "success");
    }

    // Detect speakers from pasted content (use original for detection)
    onSpeakerDetection(pastedText);
  };

  // Get non-interviewer speakers for selection
  const modelCandidates = speakerInfo?.speakers.filter(
    s => s.toLowerCase() !== INTERVIEWER_NAME.toLowerCase()
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Interview Transcript</h2>
          <p className="text-sm text-zinc-500">Paste or upload a Google Meet transcript</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Toggle */}
        <div className="flex bg-zinc-900 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setInputMode("paste")}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all
              ${inputMode === "paste"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-500 hover:text-zinc-300"
              }
            `}
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste
          </button>
          <button
            type="button"
            onClick={() => setInputMode("upload")}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all
              ${inputMode === "upload"
                ? "bg-zinc-800 text-zinc-100 shadow"
                : "text-zinc-500 hover:text-zinc-300"
              }
            `}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>

        {/* Content based on mode */}
        <AnimatePresence mode="wait">
          {inputMode === "paste" ? (
            <motion.div
              key="paste"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onPaste={handlePaste}
                placeholder={`Paste the Google Meet transcript here...

Example format:
Interviewer: So, tell me about yourself.
Jessica: Okay so like, I'm Jess, but everyone calls me JessyBaby online...`}
                rows={14}
                showCount
                maxLength={100000}
              />
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <FileDropzone
                onFileSelect={onFileSelect}
                onClear={() => {
                  setSelectedFile(null);
                  setTranscript("");
                }}
                selectedFile={selectedFile}
                accept=".txt,.vtt,.srt"
              />

              {/* Show parsed transcript preview if file was uploaded */}
              {selectedFile && transcript && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-zinc-400">Parsed transcript preview:</span>
                    <span className="text-xs text-zinc-500">
                      {transcript.length.toLocaleString()} characters
                    </span>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-mono">
                      {transcript.slice(0, 1000)}
                      {transcript.length > 1000 && (
                        <span className="text-zinc-500">... ({transcript.length - 1000} more characters)</span>
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        {transcript.length > 0 && (
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-800">
            <span>{transcript.length.toLocaleString()} characters</span>
            <span>~{Math.ceil(transcript.split(/\s+/).length / 150)} min read</span>
          </div>
        )}

        {/* Speaker Detection */}
        {speakerInfo && transcript.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4 border-t border-zinc-800"
          >
            {/* Error state */}
            {speakerInfo.error && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>{speakerInfo.error}</span>
              </div>
            )}

            {/* Single model detected */}
            {speakerInfo.model && !speakerInfo.hasMultipleModels && (
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-zinc-400">Detected creator:</span>
                <span className="text-emerald-400 font-medium">{speakerInfo.model}</span>
                {speakerInfo.interviewer && (
                  <span className="text-zinc-500 text-xs">(interviewer: {speakerInfo.interviewer})</span>
                )}
              </div>
            )}

            {/* Multiple models - selection needed */}
            {speakerInfo.hasMultipleModels && modelCandidates.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>Multiple speakers found. Select the creator:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {modelCandidates.map((speaker) => (
                    <button
                      key={speaker}
                      type="button"
                      onClick={() => onModelSelection(speaker)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${selectedModelSpeaker === speaker
                          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                        }
                      `}
                    >
                      {speaker}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show all detected speakers for reference */}
            {speakerInfo.speakers.length > 0 && !speakerInfo.error && (
              <div className="text-xs text-zinc-500 mt-2">
                All speakers: {speakerInfo.speakers.join(", ")}
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function StepExtraction({
  state,
  error,
  onRetry,
}: {
  state: ExtractionState;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        {state === "extracting" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30 flex items-center justify-center animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">
              Extracting Voice Profile
            </h3>
            <p className="text-zinc-500 mb-6">
              Claude is analyzing the transcript to extract the unique voice signature...
            </p>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-purple-500 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-6">
              This usually takes 15-30 seconds
            </p>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">
              Extraction Failed
            </h3>
            <p className="text-zinc-500 mb-6 max-w-md mx-auto">{error}</p>
            <Button onClick={onRetry}>Try Again</Button>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">
              Profile Extracted!
            </h3>
            <p className="text-zinc-500">
              Review the extracted profile on the next step
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function StepReview({
  profile,
  archetypeTags,
  toggleArchetype,
  showAllQuotes,
  setShowAllQuotes,
  displayName,
  error,
}: {
  profile: ExtractedVoiceProfile;
  archetypeTags: string[];
  toggleArchetype: (a: string) => void;
  showAllQuotes: boolean;
  setShowAllQuotes: (v: boolean) => void;
  displayName: string;
  error: string | null;
}) {
  const mix = profile.archetype_assignment?.mix || {};

  return (
    <div className="space-y-4">
      {/* Identity Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-100">Identity</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Name:</span>{" "}
              <span className="text-zinc-200">{profile.identity?.name || "—"}</span>
            </div>
            <div>
              <span className="text-zinc-500">Stage Name:</span>{" "}
              <span className="text-zinc-200">{profile.identity?.stage_name || "—"}</span>
            </div>
            <div>
              <span className="text-zinc-500">Location:</span>{" "}
              <span className="text-zinc-200">{profile.identity?.origin_location || "—"}</span>
            </div>
            <div>
              <span className="text-zinc-500">Age Range:</span>{" "}
              <span className="text-zinc-200">{profile.identity?.age_range || "—"}</span>
            </div>
          </div>
          {profile.identity?.quick_bio && (
            <p className="mt-4 text-sm text-zinc-400 italic">
              &quot;{profile.identity.quick_bio}&quot;
            </p>
          )}
        </CardContent>
      </Card>

      {/* Archetype Card */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-100">Archetype Assignment</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Detected archetypes */}
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="purple" className="text-sm px-3 py-1">
              {profile.archetype_assignment?.primary}
            </Badge>
            {profile.archetype_assignment?.secondary && (
              <Badge variant="default" className="text-sm px-3 py-1">
                {profile.archetype_assignment.secondary}
              </Badge>
            )}
            <span className="text-sm text-purple-400">
              {Math.round((profile.archetype_assignment?.confidence || 0) * 100)}% confidence
            </span>
          </div>

          {/* Mix visualization */}
          {Object.keys(mix).length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-zinc-400">Archetype Mix:</span>
              <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800">
                {Object.entries(mix).map(([archetype, pct], i) => (
                  <div
                    key={archetype}
                    className={`h-full ${i === 0 ? "bg-purple-500" : "bg-purple-400/60"}`}
                    style={{ width: `${(pct as number) * 100}%` }}
                    title={`${archetype}: ${Math.round((pct as number) * 100)}%`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                {Object.entries(mix).map(([archetype, pct]) => (
                  <span key={archetype}>
                    {archetype.replace(/_/g, " ")}: {Math.round((pct as number) * 100)}%
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Editable tags */}
          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Edit Archetype Tags</h3>
            <div className="flex flex-wrap gap-2">
              {VALID_ARCHETYPES.map((archetype) => (
                <button
                  key={archetype}
                  onClick={() => toggleArchetype(archetype)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    archetypeTags.includes(archetype)
                      ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  {archetype.replace(/_/g, " ")}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 mt-3">
              Selected: {archetypeTags.length > 0 ? archetypeTags.join(", ") : "none"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Voice Mechanics */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-100">Voice Mechanics</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <StatItem
              label="Energy"
              value={profile.personality?.energy_level}
              color={
                profile.personality?.energy_level === "high"
                  ? "orange"
                  : profile.personality?.energy_level === "medium"
                  ? "blue"
                  : "emerald"
              }
            />
            <StatItem
              label="Explicitness"
              value={profile.spicy?.explicitness_level}
              color={
                profile.spicy?.explicitness_level === "full_send"
                  ? "red"
                  : profile.spicy?.explicitness_level === "medium"
                  ? "yellow"
                  : "emerald"
              }
            />
            <StatItem label="Swearing" value={profile.voice_mechanics?.swear_frequency} />
            <StatItem label="Sentence Style" value={profile.voice_mechanics?.sentence_style} />
            <StatItem label="Humor" value={profile.personality?.humor_style} />
          </div>

          {/* Filler Words */}
          {profile.voice_mechanics?.filler_words?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <span className="text-sm text-zinc-500">Filler Words: </span>
              <span className="text-sm text-zinc-300">
                {profile.voice_mechanics.filler_words.map((f) => `${f.word} (${f.frequency})`).join(", ")}
              </span>
            </div>
          )}

          {/* Catchphrases */}
          {profile.voice_mechanics?.catchphrases?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <span className="text-sm text-zinc-500 block mb-2">Catchphrases:</span>
              <div className="flex flex-wrap gap-2">
                {profile.voice_mechanics.catchphrases.map((phrase, i) => (
                  <span key={i} className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg text-xs">
                    &quot;{phrase}&quot;
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parasocial Levers */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-100">Parasocial Levers</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-sm text-zinc-500 block mb-2">Strengths:</span>
              <div className="flex flex-wrap gap-2">
                {profile.parasocial_config?.strengths?.map((s, i) => (
                  <Badge key={i} variant="success">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm text-zinc-500 block mb-2">Avoid:</span>
              <div className="flex flex-wrap gap-2">
                {profile.parasocial_config?.avoid?.map((a, i) => (
                  <Badge key={i} variant="danger">{a}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audience */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-zinc-100">Audience</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-500">Target Viewer:</span>{" "}
              {profile.audience?.target_viewer_description ? (
                <span className="text-zinc-200">{profile.audience.target_viewer_description}</span>
              ) : (
                <span className="text-zinc-500 italic">Not mentioned in transcript</span>
              )}
            </div>
            <div>
              <span className="text-zinc-500">Fantasy Fulfilled:</span>{" "}
              {profile.audience?.fantasy_fulfilled ? (
                <span className="text-zinc-200">{profile.audience.fantasy_fulfilled}</span>
              ) : (
                <span className="text-zinc-500 italic">Not mentioned in transcript</span>
              )}
            </div>
            <div>
              <span className="text-zinc-500">How Fans Talk to Her:</span>{" "}
              {profile.audience?.how_fans_talk_to_her ? (
                <span className="text-zinc-200">{profile.audience.how_fans_talk_to_her}</span>
              ) : (
                <span className="text-zinc-500 italic">Not mentioned in transcript</span>
              )}
            </div>
            <div>
              <span className="text-zinc-500">Best Performing Content:</span>{" "}
              {profile.audience?.best_performing_content ? (
                <span className="text-zinc-200">{profile.audience.best_performing_content}</span>
              ) : (
                <span className="text-zinc-500 italic">Not mentioned in transcript</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sample Speech */}
      <Card>
        <CardHeader>
          <button
            onClick={() => setShowAllQuotes(!showAllQuotes)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="text-lg font-semibold text-zinc-100">
              Sample Speech ({profile.sample_speech?.length || 0} quotes)
            </h2>
            {showAllQuotes ? (
              <ChevronDown className="w-5 h-5 text-zinc-500" />
            ) : (
              <ChevronRight className="w-5 h-5 text-zinc-500" />
            )}
          </button>
        </CardHeader>
        <AnimatePresence>
          {showAllQuotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {profile.sample_speech?.map((quote, i) => (
                    <blockquote
                      key={i}
                      className="text-sm text-zinc-400 italic border-l-2 border-zinc-700 pl-4"
                    >
                      &quot;{quote}&quot;
                    </blockquote>
                  ))}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Boundaries */}
      {(profile.boundaries?.hard_nos?.length > 0 ||
        profile.boundaries?.topics_to_avoid?.length > 0) && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader>
            <h2 className="text-lg font-semibold text-red-400">Boundaries</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 text-sm">
              {profile.boundaries?.hard_nos?.length > 0 && (
                <div>
                  <span className="text-red-400 font-medium block mb-2">Hard Nos:</span>
                  <ul className="list-disc list-inside text-red-400/80 space-y-1">
                    {profile.boundaries.hard_nos.map((no, i) => (
                      <li key={i}>{no}</li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.boundaries?.topics_to_avoid?.length > 0 && (
                <div>
                  <span className="text-red-400 font-medium block mb-2">Topics to Avoid:</span>
                  <ul className="list-disc list-inside text-red-400/80 space-y-1">
                    {profile.boundaries.topics_to_avoid.map((topic, i) => (
                      <li key={i}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value?: string;
  color?: "orange" | "blue" | "emerald" | "red" | "yellow";
}) {
  const colorClasses = {
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };

  return (
    <div>
      <span className="text-zinc-500">{label}:</span>{" "}
      {color ? (
        <span className={`px-2 py-0.5 rounded text-xs border ${colorClasses[color]}`}>
          {value}
        </span>
      ) : (
        <span className="text-zinc-200">{value || "—"}</span>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
