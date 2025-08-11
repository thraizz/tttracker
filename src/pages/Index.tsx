import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trophy, Users } from "lucide-react";
import PlayerManagement from "@/components/PlayerManagement";
import TournamentBracket from "@/components/TournamentBracket";
import { Player, Match, Tournament } from "@/types/tournament";

const Index = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [view, setView] = useState<'setup' | 'tournament'>('setup');

  const startTournament = () => {
    if (players.length < 2) return;
    
    const matches = generateMatches(players);
    const tournament: Tournament = {
      id: Date.now().toString(),
      players,
      matches,
      status: 'active',
      createdAt: new Date()
    };
    
    setCurrentTournament(tournament);
    setView('tournament');
  };

  const generateMatches = (players: Player[]): Match[] => {
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
        losses: 0
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
            round: currentRound
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

  const resetTournament = () => {
    setCurrentTournament(null);
    setView('setup');
  };

  if (view === 'tournament' && currentTournament) {
    return (
      <TournamentBracket 
        tournament={currentTournament}
        onUpdateTournament={setCurrentTournament}
        onReset={resetTournament}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-gray to-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-ping-pong to-victory-gold flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-ping-pong to-victory-gold bg-clip-text text-transparent">
              Ping Pong Tournament
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage matches and track champions in your friend group
          </p>
        </div>

        {/* Tournament Setup */}
        <div className="grid gap-8">
          {/* Player Management Section */}
          <Card className="p-6" style={{ boxShadow: 'var(--shadow-tournament)' }}>
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-ping-pong" />
              <h2 className="text-2xl font-semibold">Players</h2>
              <div className="ml-auto bg-ping-pong/10 text-ping-pong px-3 py-1 rounded-full text-sm font-medium">
                {players.length} registered
              </div>
            </div>
            
            <PlayerManagement players={players} onUpdatePlayers={setPlayers} />
          </Card>

          {/* Start Tournament */}
          {players.length >= 2 && (
            <Card className="p-6 bg-gradient-to-r from-table-green/5 to-secondary/5 border-table-green/20">
              <div className="text-center">
                <Trophy className="w-12 h-12 text-table-green mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ready to Start!</h3>
                <p className="text-muted-foreground mb-6">
                  {players.length} players registered. Let the tournament begin!
                </p>
                <Button 
                  onClick={startTournament}
                  size="lg"
                  className="bg-gradient-to-r from-table-green to-secondary hover:from-table-green/90 hover:to-secondary/90 text-white font-semibold px-8"
                >
                  <Trophy className="w-5 h-5 mr-2" />
                  Start Tournament
                </Button>
              </div>
            </Card>
          )}

          {players.length < 2 && (
            <Card className="p-6 border-dashed border-2 border-muted">
              <div className="text-center text-muted-foreground">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Add Players to Begin</h3>
                <p>You need at least 2 players to start a tournament</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;