
import React, { useState, useCallback } from 'react';
import { AppStatus, Insight, CarouselSlide } from './types';
import { analyzeTranscript } from './services/geminiService';

const CarouselPreview: React.FC<{ slides: CarouselSlide[] }> = ({ slides }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  return (
    <div className="mt-6 bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative group">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Carousel Preview</span>
        <span className="text-[10px] font-mono">{activeSlide + 1} / {slides.length}</span>
      </div>
      
      <div className="min-h-[160px] flex flex-col justify-center transition-all duration-300 transform">
        <h5 className="text-lg font-bold mb-2 text-blue-50">{slides[activeSlide]?.title}</h5>
        <p className="text-sm text-slate-300 leading-relaxed">{slides[activeSlide]?.content}</p>
      </div>

      <div className="flex gap-2 mt-6">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveSlide(idx)}
            className={`h-1 flex-1 rounded-full transition-all ${
              idx === activeSlide ? 'bg-blue-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      
      <button 
        onClick={() => setActiveSlide(prev => (prev > 0 ? prev - 1 : slides.length - 1))}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button 
        onClick={() => setActiveSlide(prev => (prev < slides.length - 1 ? prev + 1 : 0))}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  );
};

const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => (
  <div>
    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 mb-1">
      <span>{label}</span>
      <span>{score}/10</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
        style={{ width: `${score * 10}%` }}
      />
    </div>
  </div>
);

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setStatus(AppStatus.READING);
    setError(null);
    
    try {
      const text = await file.text();
      setStatus(AppStatus.ANALYZING);
      const cleanedText = text.replace(/\d{2}:\d{2}:\d{2}.\d{3} --> \d{2}:\d{2}:\d{2}.\d{3}/g, '');
      const results = await analyzeTranscript(cleanedText);
      setInsights(results);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Insight Prioritizer</h1>
        <p className="text-slate-500 font-medium">Transcripts &rarr; Viral Content &rarr; Carousel Previews</p>
      </header>

      {status === AppStatus.IDLE || status === AppStatus.ERROR ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={`glass border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
            status === AppStatus.ERROR ? 'border-red-300 bg-red-50/30' : 'border-slate-300 hover:border-blue-400'
          }`}
        >
          <div className="mb-6 flex justify-center">
            <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Drop your transcript here</h2>
          <p className="text-slate-500 mb-6">Supports .vtt, .md, and .txt files</p>
          <label className="inline-block bg-white border border-slate-200 px-6 py-2 rounded-xl cursor-pointer hover:shadow-md transition-all font-medium">
            Browse Files
            <input type="file" className="hidden" accept=".vtt,.md,.txt" onChange={handleFileUpload} />
          </label>
          {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
        </div>
      ) : status === AppStatus.READING || status === AppStatus.ANALYZING ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          <div className="text-center">
            <p className="text-xl font-medium text-slate-800">
              {status === AppStatus.READING ? "Reading your file..." : "Extracting and designing carousels..."}
            </p>
            <p className="text-slate-500 text-sm mt-2 font-mono uppercase tracking-widest">Self-healing active</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-800 leading-none">Prioritized Results</h3>
              <p className="text-xs text-slate-400 mt-1">Found {insights.length} viral-ready nuggets</p>
            </div>
            <button 
              onClick={() => setStatus(AppStatus.IDLE)}
              className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Analyze New File
            </button>
          </div>
          
          <div className="grid gap-8">
            {insights.map((insight, idx) => (
              <div key={insight.id || idx} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {insight.category}
                      </span>
                      <h4 className="mt-4 text-2xl font-black text-slate-900 leading-tight">
                        {insight.suggestedHook}
                      </h4>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-slate-900 text-white rounded-2xl p-4 min-w-[90px] shadow-lg">
                      <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400">Score</span>
                      <span className="text-3xl font-black">{insight.totalScore.toFixed(1)}</span>
                    </div>
                  </div>

                  <p className="text-slate-600 mb-8 leading-relaxed text-lg italic">
                    "{insight.summary}"
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-50">
                    <ScoreBar label="Informative" score={insight.informativeScore} />
                    <ScoreBar label="Inspiring" score={insight.inspiringScore} />
                    <ScoreBar label="Viral" score={insight.viralScore} />
                    <ScoreBar label="LinkedIn" score={insight.linkedinScore} />
                  </div>

                  <CarouselPreview slides={insight.carouselSlides} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
