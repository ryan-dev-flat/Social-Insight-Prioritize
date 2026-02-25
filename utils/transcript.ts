/**
 * B-4: Clean a WebVTT transcript, stripping all cue metadata so only
 * spoken words are sent to the AI.
 *
 * Handles:
 *  - WEBVTT header line (and any X-TIMESTAMP-MAP: or other header fields)
 *  - NOTE blocks (single-line)
 *  - Cue sequence numbers (lines containing only digits)
 *  - Timestamp lines: HH:MM:SS.mmm --> HH:MM:SS.mmm [with optional position info]
 *  - Excess blank lines (3+ collapsed to 2)
 *
 * Plain-text and Markdown files pass through unchanged (no VTT artifacts to strip).
 */
export function cleanVttTranscript(text: string): string {
  return text
    // Remove WEBVTT header line (and any metadata that follows on the same line)
    .replace(/^WEBVTT.*$/gm, '')
    // Remove NOTE lines (single-line notes only; multi-line notes are uncommon)
    .replace(/^NOTE\b.*$/gm, '')
    // Remove cue sequence numbers (lines that contain only one or more digits)
    .replace(/^\d+\s*$/gm, '')
    // Remove timestamp lines; escape the literal dot between seconds and milliseconds
    .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}.*/g, '')
    // Collapse 3+ consecutive blank lines to 2 (preserve paragraph breaks in text)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

