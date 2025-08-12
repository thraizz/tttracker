export interface Player {
  id: string;
  name: string;
  avatar?: string;
  wins: number;
  losses: number;
  mmr: number;
  peakMmr: number;
}

export interface Match {
  id: string;
  player1: Player | null;
  player2: Player | null;
  winner?: Player;
  score?: {
    player1Score: number;
    player2Score: number;
  };
  status: 'pending' | 'in-progress' | 'completed';
  round: number;
  completedAt?: Date;
  mmrChange?: {
    player1Change: number;
    player2Change: number;
  };
  gameMode: 'tournament' | 'mmr';
}

export interface Tournament {
  id: string;
  players: Player[];
  matches: Match[];
  status: 'active' | 'completed';
  winner?: Player;
  createdAt: Date;
  completedAt?: Date;
  currentView?: 'next-match' | 'pending-matches';
}

export interface MMRMatch {
  id: string;
  player1: Player;
  player2: Player;
  winner: Player;
  score: {
    player1Score: number;
    player2Score: number;
  };
  mmrChange: {
    player1Change: number;
    player2Change: number;
    player1NewMmr: number;
    player2NewMmr: number;
  };
  completedAt: Date;
}