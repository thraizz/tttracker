import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, XCircle } from "lucide-react";
import { Tournament, Match, Player } from "@/types/tournament";
import { NextMatchView } from "./TournamentBracket/NextMatchView";
import { TournamentWinner } from "./TournamentBracket/TournamentWinner";
import { MatchesList } from "./TournamentBracket/MatchesList";
import { ScoreInputModal } from "./TournamentBracket/ScoreInputModal";

interface TournamentBracketProps {
  tournament: Tournament;
  onUpdateTournament: (tournament: Tournament) => void;
  onReset: () => void;
  onCancel: () => void;
}

const TournamentBracket = ({ tournament, onUpdateTournament, onReset, onCancel }: TournamentBracketProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentView, setCurrentView] = useState<'next-match' | 'pending-matches'>(tournament.currentView || 'next-match');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
      currentView: completedMatches === totalMatches ? 'pending-matches' as const : 'next-match' as const
    };

    onUpdateTournament(updatedTournament);
    setSelectedMatch(null);

    // Switch to next-match view after completing a match (unless tournament is complete)
    if (completedMatches < totalMatches) {
      setCurrentView('next-match');
    }
  };

  const getOverallWinner = (players: Player[]): Player => {
    return players.reduce((winner, player) => {
      if (player.wins > winner.wins) return player;
      if (player.wins === winner.wins && player.losses < winner.losses) return player;
      return winner;
    });
  };

  const handleSubmitScore = (matchId: string, player1Score: number, player2Score: number) => {
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return;

    const winner = player1Score > player2Score ? match.player1 : match.player2;
    updateMatch(matchId, winner, { player1Score, player2Score });
  };

  const pendingMatches = tournament.matches.filter(m => m.status === 'pending');
  const completedMatches = tournament.matches.filter(m => m.status === 'completed');
  const nextMatch = getNextMatch();

  // Show next match view with graph and next match info
  if (currentView === 'next-match' && tournament.status === 'active' && nextMatch) {
    return (
      <>
        <NextMatchView
          tournament={tournament}
          nextMatch={nextMatch}
          onReset={onReset}
          onCancel={() => setShowCancelConfirm(true)}
          onProceedToMatch={() => setCurrentView('pending-matches')}
        />
        {showCancelConfirm && <CancelConfirmDialog onConfirm={onCancel} onClose={() => setShowCancelConfirm(false)} />}
      </>
    );
  }

  return (
    <div className="space-y-8">
      {/* View Navigation */}
      {tournament.status === 'active' && nextMatch && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => setCurrentView('next-match')}
            className="border-ping-pong/30 text-ping-pong hover:bg-ping-pong/10"
          >
            <Trophy className="w-4 h-4 mr-2" />
            View Next Match & Tournament Graph
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowCancelConfirm(true)}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel Tournament
          </Button>
        </div>
      )}

      {tournament.status === 'completed' && tournament.winner && (
        <TournamentWinner winner={tournament.winner} />
      )}

      <MatchesList
        pendingMatches={pendingMatches}
        completedMatches={completedMatches}
        onSelectMatch={setSelectedMatch}
      />

      <ScoreInputModal
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onSubmitScore={handleSubmitScore}
      />

      {showCancelConfirm && <CancelConfirmDialog onConfirm={onCancel} onClose={() => setShowCancelConfirm(false)} />}
    </div>
  );
};

const CancelConfirmDialog = ({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <Card className="w-full max-w-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <XCircle className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-semibold">Cancel Tournament?</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        All match results will be discarded and the tournament removed. This cannot be undone.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">Keep Playing</Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          Discard & Cancel
        </Button>
      </div>
    </Card>
  </div>
);

export default TournamentBracket;