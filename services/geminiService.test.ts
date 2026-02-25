import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures the mock factory variable is available before vi.mock() hoists the call
const mockGenerateContent = vi.hoisted(() => vi.fn());

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: mockGenerateContent },
  })),
  // Type is used only as an enum in the schema config; a plain object is enough
  Type: {
    ARRAY: 'array',
    OBJECT: 'object',
    STRING: 'string',
    NUMBER: 'number',
  },
}));

import { analyzeTranscript } from './geminiService';

// Helper to build a minimal mock response object
const makeResponse = (jsonText: string) => ({ text: jsonText });

// Minimal insight shape returned by the mock API
const makeInsight = (
  id: string,
  informativeScore: number,
  inspiringScore: number,
  viralScore: number,
  linkedinScore: number
) => ({
  id,
  summary: `Summary ${id}`,
  suggestedHook: `Hook ${id}`,
  category: 'Test',
  informativeScore,
  inspiringScore,
  viralScore,
  linkedinScore,
  carouselSlides: [],
});

describe('analyzeTranscript', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes totalScore as the average of the four sub-scores', async () => {
    const insight = makeInsight('i1', 8, 6, 4, 10);
    mockGenerateContent.mockResolvedValue(makeResponse(JSON.stringify([insight])));

    const results = await analyzeTranscript('some transcript', 'test-key');

    expect(results).toHaveLength(1);
    // (8 + 6 + 4 + 10) / 4 = 7
    expect(results[0].totalScore).toBeCloseTo(7);
  });

  it('sorts results in descending order of totalScore', async () => {
    const low = makeInsight('low', 2, 2, 2, 2);   // avg 2
    const high = makeInsight('high', 10, 10, 10, 10); // avg 10
    const mid = makeInsight('mid', 5, 5, 5, 5);   // avg 5

    mockGenerateContent.mockResolvedValue(
      makeResponse(JSON.stringify([low, high, mid]))
    );

    const results = await analyzeTranscript('transcript', 'test-key');

    expect(results[0].id).toBe('high');
    expect(results[1].id).toBe('mid');
    expect(results[2].id).toBe('low');
  });

  it('returns an empty array when the API returns an empty JSON array', async () => {
    mockGenerateContent.mockResolvedValue(makeResponse('[]'));

    const results = await analyzeTranscript('transcript', 'test-key');

    expect(results).toEqual([]);
  });

  it('throws a user-friendly error when the API returns invalid JSON', async () => {
    mockGenerateContent.mockResolvedValue(makeResponse('not valid json {{'));

    await expect(analyzeTranscript('transcript', 'test-key')).rejects.toThrow(
      'The AI provided an unexpected response format. Please try again.'
    );
  });

  it('treats a missing/null response text as an empty array', async () => {
    mockGenerateContent.mockResolvedValue({ text: null });

    const results = await analyzeTranscript('transcript', 'test-key');

    expect(results).toEqual([]);
  });
});

