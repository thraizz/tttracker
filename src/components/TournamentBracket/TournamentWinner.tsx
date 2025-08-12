import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { Player } from "@/types/tournament";

interface TournamentWinnerProps {
  winner: Player;
}

export const TournamentWinner = ({ winner }: TournamentWinnerProps) => {
  return (
    <Card className="p-6 bg-gradient-to-r from-victory-gold/10 to-ping-pong/10 border-victory-gold/30">
      <div className="text-center">
        <Crown className="w-16 h-16 text-victory-gold mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tournament Champion!</h2>
        <h3 className="text-3xl font-bold text-victory-gold mb-2">{winner.name}</h3>
        <Badge className="bg-victory-gold text-white">
          {winner.wins}W - {winner.losses}L
        </Badge>
      </div>
    </Card>
  );
};