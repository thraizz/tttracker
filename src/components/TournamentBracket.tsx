import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trophy, Crown, Users, Clock } from "lucide-react";
import { Tournament, Match, Player } from "@/types/tournament";
import MatchCard from "@/components/MatchCard";
import TournamentGraph from "@/components/TournamentGraph";

interface TournamentBracketProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
  onReset: () => void;
}

const TournamentBracket = ({ tournament, onUpdateTournament, onReset }: TournamentBracketProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scorePlayer1, setScorePlayer1] = useState("");
  const [scorePlayer2, setScorePlayer2] = useState("");
  const [currentView, setCurrentView] = useState<'graph' | 'matches'>(tournament.currentView || 'graph');

  // Find the next available match to be played
  const getNextMatch = (): Match | null => {
    // Get all pending matches sorted by round
    const pendingMatches = tournament.matches
      .filter(m => m.status === 'pending' && m.player1 && m.player2 && m.player1.id !== 'bye' && m.player2.id !== 'bye')
      .sort((a, b) => a.round - b.round);

    if (pendingMatches.length === 0) return null;

    // Return the first match from the earliest round
    return pendingMatches[0];
  };

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

    // Advance winner to next round
    const currentMatch = tournament.matches.find(m => m.id === matchId);
    if (currentMatch) {
      const currentRound = currentMatch.round;
      const nextRound = currentRound + 1;
      const matchIndexInRound = parseInt(currentMatch.id.split('-match-')[1]);
      const nextMatchIndex = Math.floor(matchIndexInRound / 2);
      const nextMatchId = `round-${nextRound}-match-${nextMatchIndex}`;

      // Update next round match with winner
      updatedMatches.forEach(match => {
        if (match.id === nextMatchId) {
          if (matchIndexInRound % 2 === 0) {
            match.player1 = winner;
          } else {
            match.player2 = winner;
          }
        }
      });
    }

    // Update player stats
    const updatedPlayers = tournament.players.map(player => {
      if (player.id === winner.id && player.id !== 'bye') {
        return { ...player, wins: player.wins + 1 };
      }
      const match = tournament.matches.find(m => m.id === matchId);
      if (match && (player.id === match.player1.id || player.id === match.player2.id) && player.id !== winner.id && player.id !== 'bye') {
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
      completedAt: completedMatches === totalMatches ? new Date() : undefined,
      currentView: completedMatches === totalMatches ? 'matches' as const : 'graph' as const
    };

    onUpdateTournament(updatedTournament);
    setSelectedMatch(null);
    setScorePlayer1("");
    setScorePlayer2("");

    // Switch to graph view after completing a match (unless tournament is complete)
    if (completedMatches < totalMatches) {
      setCurrentView('graph');
    }
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
  const nextMatch = getNextMatch();

  // Show graph view with next match info and proceed button
  if (currentView === 'graph' && tournament.status === 'active' && nextMatch) {
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
              <Badge variant="secondary">In Progress</Badge>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{tournament.players.length} players</span>
            </div>
          </div>

          {/* Next Match Title */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-ping-pong mb-4">
              NEXT: {nextMatch.player1?.name?.toUpperCase()} VS {nextMatch.player2?.name?.toUpperCase()}
            </h2>
            <p className="text-muted-foreground text-lg">
              Round {nextMatch.round} • Tournament Progress
            </p>
          </div>

          {/* Tournament Graph */}
          <div className="mb-8">
            <TournamentGraph matches={tournament.matches} players={tournament.players} />
          </div>

          {/* Proceed Button */}
          <div className="text-center">
            <Button
              onClick={() => setCurrentView('matches')}
              size="lg"
              className="bg-gradient-to-r from-ping-pong to-table-green hover:from-ping-pong/90 hover:to-table-green/90 text-white font-semibold px-8"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Proceed to Match
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Tournament Graph */}
        <div className="mb-8">
          <TournamentGraph matches={tournament.matches} players={tournament.players} />
        </div>

        {/* View Tournament Graph Button */}
        {tournament.status === 'active' && nextMatch && (
          <div className="mb-8 text-center">
            <Button
              variant="outline"
              onClick={() => setCurrentView('graph')}
              className="border-ping-pong/30 text-ping-pong hover:bg-ping-pong/10"
            >
              <Trophy className="w-4 h-4 mr-2" />
              View Tournament Graph
            </Button>
          </div>
        )}

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
                    onSelectMatch={() => { }} // No interaction for completed matches
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