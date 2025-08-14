import { Users } from "lucide-react";
import { Tournament } from "@/types/tournament";

interface TournamentHeaderProps {
  tournament: Tournament;
  onReset: () => void;
}

export const TournamentHeader = ({ tournament, onReset }: TournamentHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="w-4 h-4" />
        <span>{tournament.players.length} players</span>
      </div>
    </div>
  );
};