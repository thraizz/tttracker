export interface Player {
  id: string;
  name: string;
  avatar?: string;
  wins: number;
  losses: number;
  mmr: number;
  peakMmr: number;
  isAnonymous?: boolean;
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
  matchType?: '1v1' | '2v2';
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
  // 2v2 only
  team1Players?: [Player, Player];
  team2Players?: [Player, Player];
  winnerTeam?: 1 | 2;
  team1MmrChange?: { changes: [number, number]; newMmrs: [number, number] };
  team2MmrChange?: { changes: [number, number]; newMmrs: [number, number] };
  completedAt: Date;
  groupId?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  members: string[];
  players: Player[];
  tournaments: Tournament[];
  mmrMatches: MMRMatch[];
  settings: {
    allowPublicJoin: boolean;
    requireApproval: boolean;
    maxMembers?: number;
  };
}

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  usageLimit?: number;
  usedCount: number;
}