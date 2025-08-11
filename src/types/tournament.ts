export interface Player {
  id: string;
  name: string;
  avatar?: string;
  wins: number;
  losses: number;
}

export interface Match {
  id: string;
  player1: Player;
  player2: Player;
  winner?: Player;
  score?: {
    player1Score: number;
    player2Score: number;
  };
  status: 'pending' | 'in-progress' | 'completed';
  round: number;
  completedAt?: Date;
}

export interface Tournament {
  id: string;
  players: Player[];
  matches: Match[];
  status: 'active' | 'completed';
  winner?: Player;
  createdAt: Date;
  completedAt?: Date;
}