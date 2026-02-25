
export interface CarouselSlide {
  title: string;
  content: string;
}

export interface Insight {
  id: string;
  originalText: string;
  informativeScore: number;
  inspiringScore: number;
  viralScore: number;
  linkedinScore: number;
  totalScore: number;
  summary: string;
  suggestedHook: string;
  category: string;
  carouselSlides: CarouselSlide[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  READING = 'READING',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
