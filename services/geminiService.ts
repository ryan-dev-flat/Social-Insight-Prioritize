
import { GoogleGenAI, Type } from "@google/genai";
import { Insight } from "../types";

// P-1: cache the client at module level; only re-instantiate when the key changes
let _aiClient: GoogleGenAI | null = null;
let _aiClientKey = '';

const getAiClient = (apiKey: string): GoogleGenAI => {
  if (_aiClient === null || apiKey !== _aiClientKey) {
    _aiClient = new GoogleGenAI({ apiKey });
    _aiClientKey = apiKey;
  }
  return _aiClient;
};

export const analyzeTranscript = async (content: string, apiKey: string): Promise<Insight[]> => {
  const ai = getAiClient(apiKey);
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Analyze the following transcript content. Extract the top 5-8 distinct, high-impact insights that would make for compelling social media content. 
    For each insight, provide:
    - A summary of the core idea
    - A suggested hook for a post
    - A category (e.g., Growth, Tech, Wellness, Business)
    - Scores from 1 to 10 for: Informative, Inspiring, Viral, and LinkedIn suitability.
    - A 3-5 slide visual carousel outline (title and content for each slide) that breaks down the insight for a LinkedIn/Instagram carousel.
    
    Content to analyze:
    ${content.slice(0, 30000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["id", "summary", "suggestedHook", "category", "informativeScore", "inspiringScore", "viralScore", "linkedinScore", "carouselSlides"],
          properties: {
            id: { type: Type.STRING },
            summary: { type: Type.STRING },
            suggestedHook: { type: Type.STRING },
            category: { type: Type.STRING },
            informativeScore: { type: Type.NUMBER },
            inspiringScore: { type: Type.NUMBER },
            viralScore: { type: Type.NUMBER },
            linkedinScore: { type: Type.NUMBER },
            carouselSlides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "content"],
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  });

  try {
    const text = response.text || "[]";
    const insights = JSON.parse(text) as Insight[];
    return insights.map(i => ({
      ...i,
      totalScore: (i.informativeScore + i.inspiringScore + i.viralScore + i.linkedinScore) / 4
    })).sort((a, b) => b.totalScore - a.totalScore);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("The AI provided an unexpected response format. Please try again.");
  }
};
