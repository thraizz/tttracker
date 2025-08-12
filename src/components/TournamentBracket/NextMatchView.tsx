import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { Match, Tournament } from "@/types/tournament";
import TournamentGraph from "@/components/TournamentGraph";
import { TournamentHeader } from "./TournamentHeader";

interface NextMatchViewProps {
  tournament: Tournament;
  nextMatch: Match;
  onReset: () => void;
  onProceedToMatch: () => void;
}

export const NextMatchView = ({ tournament, nextMatch, onReset, onProceedToMatch }: NextMatchViewProps) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <TournamentHeader tournament={tournament} onReset={onReset} />

      {/* Next Match Title */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-ping-pong mb-4">
          NEXT: {nextMatch.player1?.name?.toUpperCase()} VS {nextMatch.player2?.name?.toUpperCase()}
        </h2>
        <p className="text-muted-foreground text-lg">
          Round {nextMatch.round} • Tournament Progress
        </p>
      </div>

      {/* Tournament Graph */}
      <div>
        <TournamentGraph matches={tournament.matches} players={tournament.players} />
      </div>

      {/* Navigation Buttons */}
      <div className="text-center space-x-4">
        <Button
          onClick={onProceedToMatch}
          size="lg"
          className="bg-gradient-to-r from-ping-pong to-table-green hover:from-ping-pong/90 hover:to-table-green/90 text-white font-semibold px-8"
        >
          <Trophy className="w-5 h-5 mr-2" />
          Proceed to Match
        </Button>
      </div>
    </div>
  );
};