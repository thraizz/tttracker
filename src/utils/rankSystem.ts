export interface Rank {
  name: string;
  icon: string;
  color: string;
  minMmr: number;
  maxMmr: number;
}

export const RANKS: Rank[] = [
  { name: 'Wood', icon: '🪵', color: '#8B4513', minMmr: 0, maxMmr: 599 },
  { name: 'Aluminum', icon: '⚪', color: '#C0C0C0', minMmr: 600, maxMmr: 799 },
  { name: 'Composite', icon: '🔶', color: '#FF6B35', minMmr: 800, maxMmr: 999 },
  { name: 'Titanium', icon: '⭐', color: '#E5E4E2', minMmr: 1000, maxMmr: 1199 },
  { name: 'Carbon', icon: '⚫', color: '#2C2C2C', minMmr: 1200, maxMmr: 1399 },
  { name: 'Diamond', icon: '💎', color: '#B9F2FF', minMmr: 1400, maxMmr: 1599 },
  { name: 'Legend', icon: '👑', color: '#FFD700', minMmr: 1600, maxMmr: Infinity }
];

export const getRankByMmr = (mmr: number): Rank => {
  return RANKS.find(rank => mmr >= rank.minMmr && mmr <= rank.maxMmr) || RANKS[0];
};

export const getRankProgress = (mmr: number): { current: Rank; progress: number; nextRank?: Rank } => {
  const currentRank = getRankByMmr(mmr);
  const currentIndex = RANKS.indexOf(currentRank);
  const nextRank = currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : undefined;
  
  let progress = 0;
  if (currentRank.maxMmr !== Infinity) {
    const rankRange = currentRank.maxMmr - currentRank.minMmr;
    const playerProgress = mmr - currentRank.minMmr;
    progress = Math.min(100, Math.max(0, (playerProgress / rankRange) * 100));
  } else {
    // For Master rank, show 100% progress
    progress = 100;
  }
  
  return {
    current: currentRank,
    progress: Math.round(progress),
    nextRank
  };
};

export const formatRankDisplay = (rank: Rank): string => {
  return `${rank.icon} ${rank.name}`;
};