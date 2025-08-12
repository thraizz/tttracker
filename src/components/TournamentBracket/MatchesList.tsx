import { Badge } from "@/components/ui/badge";
import { Clock, Trophy } from "lucide-react";
import { Match } from "@/types/tournament";
import MatchCard from "@/components/MatchCard";

interface MatchesListProps {
  pendingMatches: Match[];
  completedMatches: Match[];
  onSelectMatch: (match: Match) => void;
}

export const MatchesList = ({ pendingMatches, completedMatches, onSelectMatch }: MatchesListProps) => {
  return (
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
                onSelectMatch={onSelectMatch}
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
  );
};