import { Player, Match } from "@/types/tournament";

export const generateMatches = (players: Player[]): Match[] => {
  const matches: Match[] = [];
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  // Create single elimination bracket
  let currentRound = 1;
  let roundPlayers = [...shuffledPlayers];

  // Add bye players if odd number
  if (roundPlayers.length % 2 === 1) {
    roundPlayers.push({
      id: 'bye',
      name: 'BYE',
      wins: 0,
      losses: 0,
      mmr: 1000,
      peakMmr: 1000
    });
  }

  // Generate bracket rounds
  while (roundPlayers.length > 1) {
    const roundMatches: Match[] = [];

    for (let i = 0; i < roundPlayers.length; i += 2) {
      if (i + 1 < roundPlayers.length) {
        roundMatches.push({
          id: `round-${currentRound}-match-${Math.floor(i / 2)}`,
          player1: roundPlayers[i],
          player2: roundPlayers[i + 1],
          status: 'pending',
          round: currentRound,
          gameMode: 'tournament'
        });
      }
    }

    matches.push(...roundMatches);

    // Prepare for next round (winners will be determined during play)
    roundPlayers = new Array(Math.ceil(roundPlayers.length / 2)).fill(null);
    currentRound++;
  }

  return matches;
};