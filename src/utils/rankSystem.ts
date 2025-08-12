export interface Rank {
  name: string;
  icon: string;
  color: string;
  minMmr: number;
  maxMmr: number;
}

// Utility function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Calculate relative luminance
const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

// Calculate contrast ratio between two colors
const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// Check if color has sufficient contrast against light and dark backgrounds
const hasGoodContrast = (color: string): { onLight: boolean; onDark: boolean } => {
  const lightBg = '#ffffff';
  const darkBg = '#000000';
  
  const contrastOnLight = getContrastRatio(color, lightBg);
  const contrastOnDark = getContrastRatio(color, darkBg);
  
  // WCAG AA standard requires 4.5:1 for normal text
  return {
    onLight: contrastOnLight >= 4.5,
    onDark: contrastOnDark >= 4.5
  };
};

// Generate a contrast-safe version of a color
const getContrastSafeColor = (originalColor: string): { light: string; dark: string } => {
  const rgb = hexToRgb(originalColor);
  if (!rgb) return { light: originalColor, dark: originalColor };
  
  const { onLight, onDark } = hasGoodContrast(originalColor);
  
  if (onLight && onDark) {
    return { light: originalColor, dark: originalColor };
  }
  
  // If poor contrast, create darker/lighter versions
  let lightModeColor = originalColor;
  let darkModeColor = originalColor;
  
  if (!onLight) {
    // Make darker for light backgrounds
    const factor = 0.3; // Darken by 70%
    lightModeColor = `#${Math.round(rgb.r * factor).toString(16).padStart(2, '0')}${Math.round(rgb.g * factor).toString(16).padStart(2, '0')}${Math.round(rgb.b * factor).toString(16).padStart(2, '0')}`;
  }
  
  if (!onDark) {
    // Make lighter for dark backgrounds  
    const factor = 0.7; // Lighten
    darkModeColor = `#${Math.min(255, Math.round(rgb.r + (255 - rgb.r) * factor)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(rgb.g + (255 - rgb.g) * factor)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(rgb.b + (255 - rgb.b) * factor)).toString(16).padStart(2, '0')}`;
  }
  
  return { light: lightModeColor, dark: darkModeColor };
};

export const RANKS: Rank[] = [
  { name: 'Iron', icon: '🔩', color: '#6B4423', minMmr: 0, maxMmr: 599 },
  { name: 'Bronze', icon: '🥉', color: '#CD7F32', minMmr: 600, maxMmr: 799 },
  { name: 'Silver', icon: '🥈', color: '#C0C0C0', minMmr: 800, maxMmr: 999 },
  { name: 'Gold', icon: '🥇', color: '#FFD700', minMmr: 1000, maxMmr: 1199 },
  { name: 'Platinum', icon: '💿', color: '#E5E4E2', minMmr: 1200, maxMmr: 1399 },
  { name: 'Diamond', icon: '💎', color: '#B9F2FF', minMmr: 1400, maxMmr: 1599 },
  { name: 'Master', icon: '👑', color: '#9370DB', minMmr: 1600, maxMmr: Infinity }
];

export const getRankByMmr = (mmr: number): Rank => {
  return RANKS.find(rank => mmr >= rank.minMmr && mmr <= rank.maxMmr) || RANKS[0];
};

// Get contrast-safe color for a rank based on theme
export const getRankColorForTheme = (rank: Rank, isDark: boolean = false): string => {
  const contrastSafe = getContrastSafeColor(rank.color);
  return isDark ? contrastSafe.dark : contrastSafe.light;
};

// Enhanced rank object with contrast-safe colors
export interface RankWithContrast extends Rank {
  contrastSafeColor: string;
  originalColor: string;
}

export const getRankByMmrWithContrast = (mmr: number, isDark: boolean = false): RankWithContrast => {
  const baseRank = getRankByMmr(mmr);
  const contrastSafeColor = getRankColorForTheme(baseRank, isDark);
  
  return {
    ...baseRank,
    contrastSafeColor,
    originalColor: baseRank.color,
    color: contrastSafeColor // Override the color with contrast-safe version
  };
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