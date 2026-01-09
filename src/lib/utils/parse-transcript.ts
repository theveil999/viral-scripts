/**
 * Transcript parsing utilities for Google Meet, VTT, SRT, and plain text files
 */

// The interviewer name - hardcoded as specified
export const INTERVIEWER_NAME = "The Veil Owners";

/**
 * Speaker extraction result
 */
export interface SpeakerInfo {
  interviewer: string | null;
  model: string | null;
  speakers: string[];
  hasMultipleModels: boolean;
  error: string | null;
}

/**
 * Parsed transcript result with speaker info
 */
export interface ParsedTranscript {
  formatted: string;
  modelName: string | null;
  speakers: string[];
  speakerInfo: SpeakerInfo;
}

/**
 * Extract unique speaker names from transcript
 * Identifies interviewer (The Veil Owners) and model
 */
export function extractSpeakersFromTranscript(raw: string): SpeakerInfo {
  // Pattern to match speaker labels: "Name Name:" or "Name:"
  const speakerPattern = /([A-Z][a-zA-Z\s]{1,50}):/g;
  const matches = raw.matchAll(speakerPattern);

  // Extract unique speaker names
  const speakerSet = new Set<string>();
  for (const match of matches) {
    const name = match[1].trim();
    // Filter out very short matches that might be false positives
    if (name.length >= 2) {
      speakerSet.add(name);
    }
  }

  const speakers = Array.from(speakerSet);

  // Check if interviewer is present
  const hasInterviewer = speakers.some(
    s => s.toLowerCase() === INTERVIEWER_NAME.toLowerCase()
  );

  // Get non-interviewer speakers (potential models)
  const nonInterviewerSpeakers = speakers.filter(
    s => s.toLowerCase() !== INTERVIEWER_NAME.toLowerCase()
  );

  // Handle edge cases
  if (speakers.length === 0) {
    return {
      interviewer: null,
      model: null,
      speakers: [],
      hasMultipleModels: false,
      error: "No speakers detected in transcript",
    };
  }

  // Only interviewer, no model
  if (speakers.length === 1 && hasInterviewer) {
    return {
      interviewer: INTERVIEWER_NAME,
      model: null,
      speakers,
      hasMultipleModels: false,
      error: "No model detected in transcript - only interviewer found",
    };
  }

  // Solo recording (one speaker, not the interviewer)
  if (speakers.length === 1 && !hasInterviewer) {
    return {
      interviewer: null,
      model: speakers[0],
      speakers,
      hasMultipleModels: false,
      error: null,
    };
  }

  // Standard interview (2 speakers: interviewer + model)
  if (nonInterviewerSpeakers.length === 1) {
    return {
      interviewer: hasInterviewer ? INTERVIEWER_NAME : null,
      model: nonInterviewerSpeakers[0],
      speakers,
      hasMultipleModels: false,
      error: null,
    };
  }

  // Multiple potential models - needs manual selection
  return {
    interviewer: hasInterviewer ? INTERVIEWER_NAME : null,
    model: null, // User needs to select
    speakers,
    hasMultipleModels: true,
    error: null,
  };
}

/**
 * Clean up speaker name formatting
 * Handles weird capitalizations, extra spaces, etc.
 */
export function cleanSpeakerName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Normalize spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Detect if content looks like a Google Meet transcript
 * Pattern: Speaker labels inline without line breaks
 * e.g., "text text.Speaker Name: more text"
 */
export function isGoogleMeetFormat(content: string): boolean {
  // Look for pattern: word/punctuation immediately followed by capitalized speaker label
  // e.g., "something.Speaker Name:" or "something,Speaker Name:"
  const inlineSpeakerPattern = /[.!?,]\s*[A-Z][a-zA-Z\s]+:/;

  // Also check for multiple speaker labels without proper line breaks between them
  const speakerLabels = content.match(/[A-Z][a-zA-Z\s]{2,}:/g);

  if (!speakerLabels || speakerLabels.length < 2) {
    return false;
  }

  // If we have multiple speakers and inline pattern matches, it's likely Google Meet
  return inlineSpeakerPattern.test(content);
}

/**
 * Parse Google Meet transcript format
 *
 * Input format (all on one line, no breaks):
 * "there for other people's sake.The Veil Owners: Hell yeah.Jewel Anna: Um, I hate to"
 *
 * Output format (readable with line breaks):
 * """
 * there for other people's sake.
 *
 * The Veil Owners: Hell yeah.
 *
 * Jewel Anna: Um, I hate to
 * """
 */
export function parseGoogleMeetTranscript(raw: string): string {
  // Normalize line endings first
  let content = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Pattern to match speaker labels
  // Matches: "Name Name:" or "Name:" where name starts with capital letter
  // The lookbehind ensures we're after a sentence-ending punctuation or start
  const speakerPattern = /([.!?])\s*([A-Z][a-zA-Z\s]{1,50}:)/g;

  // Insert line breaks before speaker labels that follow punctuation
  content = content.replace(speakerPattern, '$1\n\n$2');

  // Also handle cases where speaker label comes after a word without punctuation
  // e.g., "somethingThe Veil Owners:" -> "something\n\nThe Veil Owners:"
  content = content.replace(/([a-z])([A-Z][a-zA-Z\s]{1,50}:)/g, '$1\n\n$2');

  // Handle case at the very beginning
  content = content.replace(/^([A-Z][a-zA-Z\s]{1,50}:)/, '\n$1');

  // Clean up multiple newlines (max 2)
  content = content.replace(/\n{3,}/g, '\n\n');

  // Clean up multiple spaces
  content = content.replace(/  +/g, ' ');

  // Trim each line
  content = content
    .split('\n')
    .map(line => line.trim())
    .join('\n');

  return content.trim();
}

/**
 * Parse VTT (Web Video Text Tracks) format
 * Strips timestamps, cue identifiers, and formatting
 */
export function parseVTT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];
  let inCue = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip WEBVTT header and metadata
    if (trimmed.startsWith('WEBVTT') || trimmed.startsWith('NOTE')) {
      continue;
    }

    // Skip empty lines (they separate cues)
    if (!trimmed) {
      inCue = false;
      continue;
    }

    // Skip timestamp lines (contain --> )
    if (trimmed.includes('-->')) {
      inCue = true;
      continue;
    }

    // Skip cue identifiers (numeric or alphanumeric before timestamps)
    if (/^\d+$/.test(trimmed) || /^[a-zA-Z0-9-]+$/.test(trimmed)) {
      continue;
    }

    // If we're in a cue, this is actual text
    if (inCue || !trimmed.match(/^\d{2}:\d{2}/)) {
      // Strip VTT formatting tags like <v Speaker>, <c>, etc.
      let cleanText = trimmed
        .replace(/<v[^>]*>/g, '') // Remove voice tags
        .replace(/<\/v>/g, '')
        .replace(/<c[^>]*>/g, '') // Remove class tags
        .replace(/<\/c>/g, '')
        .replace(/<[^>]+>/g, '') // Remove any other tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();

      if (cleanText) {
        textLines.push(cleanText);
      }
    }
  }

  // Join lines with spaces, then check if it's Google Meet format
  const joined = textLines.join(' ').replace(/\s+/g, ' ').trim();

  // VTT from Google Meet might still have inline speaker labels
  if (isGoogleMeetFormat(joined)) {
    return parseGoogleMeetTranscript(joined);
  }

  return joined;
}

/**
 * Parse SRT (SubRip) format
 * Strips sequence numbers, timestamps, and formatting
 */
export function parseSRT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Skip sequence numbers (just digits)
    if (/^\d+$/.test(trimmed)) {
      continue;
    }

    // Skip timestamp lines (contain --> )
    if (trimmed.includes('-->')) {
      continue;
    }

    // Strip SRT formatting tags like <i>, <b>, <font>, etc.
    let cleanText = trimmed
      .replace(/<\/?[ibus]>/gi, '') // Remove italic, bold, underline, strike
      .replace(/<\/?font[^>]*>/gi, '') // Remove font tags
      .replace(/\{\\[^}]+\}/g, '') // Remove ASS/SSA style tags
      .replace(/<[^>]+>/g, '') // Remove any other HTML-like tags
      .trim();

    if (cleanText) {
      textLines.push(cleanText);
    }
  }

  // Join lines with spaces
  const joined = textLines.join(' ').replace(/\s+/g, ' ').trim();

  // Check if it's Google Meet format
  if (isGoogleMeetFormat(joined)) {
    return parseGoogleMeetTranscript(joined);
  }

  return joined;
}

/**
 * Parse plain text file
 * Auto-detects and formats Google Meet transcripts
 */
export function parseTXT(content: string): string {
  // Normalize line endings
  let text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Check if it's Google Meet format
  if (isGoogleMeetFormat(text)) {
    return parseGoogleMeetTranscript(text);
  }

  return text;
}

/**
 * Auto-format result with speaker info
 */
export interface AutoFormatResult {
  formatted: string;
  wasFormatted: boolean;
  speakerInfo: SpeakerInfo;
}

/**
 * Auto-format content if it matches Google Meet format
 * Returns formatted text and speaker info
 */
export function autoFormatTranscript(content: string): AutoFormatResult {
  const speakerInfo = extractSpeakersFromTranscript(content);

  if (isGoogleMeetFormat(content)) {
    return {
      formatted: parseGoogleMeetTranscript(content),
      wasFormatted: true,
      speakerInfo,
    };
  }
  return {
    formatted: content,
    wasFormatted: false,
    speakerInfo,
  };
}

/**
 * Parse transcript with full metadata
 * Use this for complete parsing with speaker detection
 */
export function parseTranscriptWithSpeakers(content: string, filename?: string): ParsedTranscript {
  const ext = filename?.toLowerCase().split('.').pop();
  let formatted: string;

  switch (ext) {
    case 'vtt':
      formatted = parseVTT(content);
      break;
    case 'srt':
      formatted = parseSRT(content);
      break;
    case 'txt':
    default:
      formatted = parseTXT(content);
  }

  const speakerInfo = extractSpeakersFromTranscript(content);

  return {
    formatted,
    modelName: speakerInfo.model,
    speakers: speakerInfo.speakers,
    speakerInfo,
  };
}

/**
 * Detect file type and parse accordingly
 */
export function parseTranscriptContent(content: string, filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();

  switch (ext) {
    case 'vtt':
      return parseVTT(content);
    case 'srt':
      return parseSRT(content);
    case 'txt':
    default:
      return parseTXT(content);
  }
}

/**
 * Parse a transcript file
 * Handles VTT, SRT, and TXT files
 * Auto-detects and formats Google Meet transcripts
 */
export async function parseTranscriptFile(file: File): Promise<string> {
  const content = await file.text();
  return parseTranscriptContent(content, file.name);
}

/**
 * Supported file extensions
 */
export const SUPPORTED_EXTENSIONS = ['.txt', '.vtt', '.srt'];
export const SUPPORTED_MIME_TYPES = [
  'text/plain',
  'text/vtt',
  'application/x-subrip',
  'text/srt',
];

/**
 * Check if a file is a supported transcript format
 */
export function isSupportedTranscriptFile(file: File): boolean {
  const ext = '.' + file.name.toLowerCase().split('.').pop();
  return SUPPORTED_EXTENSIONS.includes(ext);
}
