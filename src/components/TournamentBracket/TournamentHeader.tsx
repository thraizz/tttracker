import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy, Users } from "lucide-react";
import { Tournament } from "@/types/tournament";

interface TournamentHeaderProps {
  tournament: Tournament;
  onReset: () => void;
}

export const TournamentHeader = ({ tournament, onReset }: TournamentHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Setup
      </Button>

      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-ping-pong" />
          <h1 className="text-2xl font-bold">Tournament Bracket</h1>
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
  );
};