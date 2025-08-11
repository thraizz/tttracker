import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trophy, Crown, Users, Clock } from "lucide-react";
import { Tournament, Match, Player } from "@/types/tournament";
import MatchCard from "@/components/MatchCard";

interface TournamentBracketProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
  onReset: () => void;
}

const TournamentBracket = ({ tournament, onUpdateTournament, onReset }: TournamentBracketProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scorePlayer1, setScorePlayer1] = useState("");
  const [scorePlayer2, setScorePlayer2] = useState("");

  const updateMatch = (matchId: string, winner: Player, score: { player1Score: number; player2Score: number }) => {
    const updatedMatches = tournament.matches.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          winner,
          score,
          status: 'completed' as const,
          completedAt: new Date()
        };
      }
      return match;
    });

    // Update player stats
    const updatedPlayers = tournament.players.map(player => {
      if (player.id === winner.id) {
        return { ...player, wins: player.wins + 1 };
      }
      const match = tournament.matches.find(m => m.id === matchId);
      if (match && (player.id === match.player1.id || player.id === match.player2.id) && player.id !== winner.id) {
        return { ...player, losses: player.losses + 1 };
      }
      return player;
    });

    const completedMatches = updatedMatches.filter(m => m.status === 'completed').length;
    const totalMatches = updatedMatches.length;
    
    const updatedTournament = {
      ...tournament,
      matches: updatedMatches,
      players: updatedPlayers,
      status: completedMatches === totalMatches ? 'completed' as const : 'active' as const,
      winner: completedMatches === totalMatches ? getOverallWinner(updatedPlayers) : undefined,
      completedAt: completedMatches === totalMatches ? new Date() : undefined
    };

    onUpdateTournament(updatedTournament);
    setSelectedMatch(null);
    setScorePlayer1("");
    setScorePlayer2("");
  };

  const getOverallWinner = (players: Player[]): Player => {
    return players.reduce((winner, player) => {
      if (player.wins > winner.wins) return player;
      if (player.wins === winner.wins && player.losses < winner.losses) return player;
      return winner;
    });
  };

  const submitScore = () => {
    if (!selectedMatch || !scorePlayer1 || !scorePlayer2) return;
    
    const p1Score = parseInt(scorePlayer1);
    const p2Score = parseInt(scorePlayer2);
    
    if (isNaN(p1Score) || isNaN(p2Score) || p1Score === p2Score) return;
    
    const winner = p1Score > p2Score ? selectedMatch.player1 : selectedMatch.player2;
    updateMatch(selectedMatch.id, winner, { player1Score: p1Score, player2Score: p2Score });
  };

  const pendingMatches = tournament.matches.filter(m => m.status === 'pending');
  const completedMatches = tournament.matches.filter(m => m.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-gray to-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Setup
          </Button>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-ping-pong" />
              <h1 className="text-3xl font-bold">Tournament Bracket</h1>
            </div>
            <Badge variant={tournament.status === 'completed' ? 'default' : 'secondary'}>
              {tournament.status === 'completed' ? 'Completed' : 'In Progress'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{tournament.players.length} players</span>
          </div>
        </div>

        {/* Tournament Winner */}
        {tournament.status === 'completed' && tournament.winner && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-victory-gold/10 to-ping-pong/10 border-victory-gold/30">
            <div className="text-center">
              <Crown className="w-16 h-16 text-victory-gold mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tournament Champion!</h2>
              <h3 className="text-3xl font-bold text-victory-gold mb-2">{tournament.winner.name}</h3>
              <Badge className="bg-victory-gold text-white">
                {tournament.winner.wins}W - {tournament.winner.losses}L
              </Badge>
            </div>
          </Card>
        )}

        {/* Matches Grid */}
        <div className="grid gap-8">
          {/* Pending Matches */}
          {pendingMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-ping-pong" />
                <h2 className="text-xl font-semibold">Pending Matches</h2>
                <Badge>{pendingMatches.length} remaining</Badge>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onSelectMatch={setSelectedMatch}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Matches */}
          {completedMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-5 h-5 text-table-green" />
                <h2 className="text-xl font-semibold">Completed Matches</h2>
                <Badge variant="secondary">{completedMatches.length} completed</Badge>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onSelectMatch={() => {}} // No interaction for completed matches
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Score Input Modal */}
        {selectedMatch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-center">Record Match Result</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{selectedMatch.player1.name}</span>
                  <Input
                    type="number"
                    placeholder="Score"
                    value={scorePlayer1}
                    onChange={(e) => setScorePlayer1(e.target.value)}
                    className="w-20 text-center"
                  />
                </div>
                
                <div className="text-center text-muted-foreground">VS</div>
                
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">{selectedMatch.player2.name}</span>
                  <Input
                    type="number"
                    placeholder="Score"
                    value={scorePlayer2}
                    onChange={(e) => setScorePlayer2(e.target.value)}
                    className="w-20 text-center"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitScore}
                  disabled={!scorePlayer1 || !scorePlayer2 || parseInt(scorePlayer1) === parseInt(scorePlayer2)}
                  className="flex-1 bg-table-green hover:bg-table-green/90 text-white"
                >
                  Record Result
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentBracket;