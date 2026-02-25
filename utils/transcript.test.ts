import { describe, it, expect } from 'vitest';
import { cleanVttTranscript } from './transcript';

describe('cleanVttTranscript', () => {
  it('removes the WEBVTT header line', () => {
    const input = 'WEBVTT\n\nHello world';
    expect(cleanVttTranscript(input)).not.toContain('WEBVTT');
    expect(cleanVttTranscript(input)).toContain('Hello world');
  });

  it('removes WEBVTT header with metadata on the same line', () => {
    const input = 'WEBVTT - This file has metadata\n\nSpoken text here';
    expect(cleanVttTranscript(input)).not.toContain('WEBVTT');
    expect(cleanVttTranscript(input)).toContain('Spoken text here');
  });

  it('removes timestamp lines', () => {
    const input = '00:00:01.000 --> 00:00:03.500\nThis is spoken text.';
    const result = cleanVttTranscript(input);
    expect(result).not.toContain('-->');
    expect(result).toContain('This is spoken text.');
  });

  it('does NOT remove a timestamp due to an unescaped dot (B-4 regression)', () => {
    // The old regex used /\d{2}:\d{2}:\d{2}.\d{3}/ — the unescaped dot would
    // match any character including a letter, potentially leaving timestamps in.
    // The fixed regex escapes the dot: \.\d{3}
    const timestamp = '00:01:23.456 --> 00:01:25.789';
    const result = cleanVttTranscript(timestamp);
    expect(result).not.toContain('-->');
  });

  it('removes cue sequence numbers (lines with only digits)', () => {
    const input = 'WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\nHello.\n\n2\n00:00:04.000 --> 00:00:06.000\nWorld.';
    const result = cleanVttTranscript(input);
    // Sequence numbers "1" and "2" should not appear as standalone lines
    expect(result.split('\n').map(l => l.trim())).not.toContain('1');
    expect(result.split('\n').map(l => l.trim())).not.toContain('2');
    expect(result).toContain('Hello.');
    expect(result).toContain('World.');
  });

  it('removes NOTE lines', () => {
    const input = 'WEBVTT\n\nNOTE This is a comment\n\nActual speech here.';
    const result = cleanVttTranscript(input);
    expect(result).not.toContain('NOTE');
    expect(result).toContain('Actual speech here.');
  });

  it('collapses excessive blank lines', () => {
    const input = 'Line one\n\n\n\n\nLine two';
    const result = cleanVttTranscript(input);
    expect(result).not.toMatch(/\n{3,}/);
    expect(result).toContain('Line one');
    expect(result).toContain('Line two');
  });

  it('passes plain text through unchanged (no VTT noise to strip)', () => {
    const input = 'This is a plain text transcript.\nIt has two lines.';
    const result = cleanVttTranscript(input);
    expect(result).toBe(input.trim());
  });

  it('trims leading and trailing whitespace', () => {
    const input = '\n\nHello world\n\n';
    expect(cleanVttTranscript(input)).toBe('Hello world');
  });

  it('handles an empty string without throwing', () => {
    expect(() => cleanVttTranscript('')).not.toThrow();
    expect(cleanVttTranscript('')).toBe('');
  });

  it('handles a full realistic VTT snippet correctly', () => {
    const vtt = [
      'WEBVTT',
      '',
      '1',
      '00:00:00.500 --> 00:00:02.000',
      'Welcome to the podcast.',
      '',
      '2',
      '00:00:02.500 --> 00:00:05.000',
      'Today we discuss AI trends.',
      '',
      'NOTE This cue was manually corrected',
      '',
      '3',
      '00:00:05.200 --> 00:00:08.000',
      'Let\'s get started.',
    ].join('\n');

    const result = cleanVttTranscript(vtt);
    expect(result).toContain('Welcome to the podcast.');
    expect(result).toContain('Today we discuss AI trends.');
    expect(result).toContain("Let's get started.");
    expect(result).not.toContain('WEBVTT');
    expect(result).not.toContain('-->');
    expect(result).not.toContain('NOTE');
  });
});

