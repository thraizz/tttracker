import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trophy } from "lucide-react";
import { Player } from "@/types/tournament";

interface TournamentSetupViewProps {
  players: Player[];
  onStartTournament: () => void;
}

export const TournamentSetupView = ({ players, onStartTournament }: TournamentSetupViewProps) => {
  if (players.length < 2) {
    return (
      <Card className="p-8 text-center">
        <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">Add Players to Begin</h3>
        <p className="text-muted-foreground">You need at least 2 players to start a tournament</p>
      </Card>
    );
  }
  
  return (
    <Card className="p-8 bg-gradient-to-r from-table-green/5 to-secondary/5 border-table-green/20">
      <div className="text-center">
        <Trophy className="w-16 h-16 text-table-green mx-auto mb-6" />
        <h3 className="text-2xl font-semibold mb-4">Ready to Start Tournament!</h3>
        <p className="text-muted-foreground text-lg mb-8">
          {players.length} players registered. Create a single-elimination bracket!
        </p>
        <Button 
          onClick={onStartTournament}
          size="lg"
          className="bg-gradient-to-r from-table-green to-secondary hover:from-table-green/90 hover:to-secondary/90 text-white font-semibold px-8 py-3 text-lg"
        >
          <Trophy className="w-6 h-6 mr-3" />
          Start Tournament
        </Button>
      </div>
    </Card>
  );
};