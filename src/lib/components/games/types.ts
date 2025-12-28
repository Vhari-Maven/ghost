export type Game = {
  id: number;
  name: string;
  genre: string | null;
  tier: string;
  releaseYear: number | null;
  comment: string | null;
  steamAppId: string | null;
  coverUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type GameTier = 'S' | 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C';

export type TierConfig = {
  id: GameTier;
  title: string;
  color: string;
  bgColor: string;
};

export const TIER_CONFIGS: Record<GameTier, TierConfig> = {
  S: { id: 'S', title: 'S', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' },
  'A+': { id: 'A+', title: 'A+', color: '#a3e635', bgColor: 'rgba(163, 230, 53, 0.15)' },
  A: { id: 'A', title: 'A', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  'A-': { id: 'A-', title: 'A-', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.15)' },
  'B+': { id: 'B+', title: 'B+', color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.15)' },
  B: { id: 'B', title: 'B', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' },
  'B-': { id: 'B-', title: 'B-', color: '#818cf8', bgColor: 'rgba(129, 140, 248, 0.15)' },
  'C+': { id: 'C+', title: 'C+', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' },
  C: { id: 'C', title: 'C', color: '#c084fc', bgColor: 'rgba(192, 132, 252, 0.15)' },
};

export const TIER_ORDER: GameTier[] = ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
