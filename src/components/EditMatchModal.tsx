import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MMRMatch, Player } from "@/types/tournament";

interface EditMatchModalProps {
  match: MMRMatch;
  players: Player[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateMatch: (match: MMRMatch) => void;
}

export const EditMatchModal = ({ match, players, open, onOpenChange, onUpdateMatch }: EditMatchModalProps) => {
  const [selectedWinner, setSelectedWinner] = useState<string>(match.winner.id);
  const [player1Score, setPlayer1Score] = useState<string>(match.score.player1Score.toString());
  const [player2Score, setPlayer2Score] = useState<string>(match.score.player2Score.toString());

  const calculateMmrChange = (player1: Player, player2: Player, winnerId: string, score1: number, score2: number) => {
    const k = 32;
    const expectedScore1 = 1 / (1 + Math.pow(10, (player2.mmr - player1.mmr) / 400));
    const expectedScore2 = 1 - expectedScore1;
    
    const actualScore1 = winnerId === player1.id ? 1 : 0;
    const actualScore2 = winnerId === player2.id ? 1 : 0;
    
    const change1 = Math.round(k * (actualScore1 - expectedScore1));
    const change2 = Math.round(k * (actualScore2 - expectedScore2));
    
    return {
      player1Change: change1,
      player2Change: change2,
      player1NewMmr: player1.mmr + change1,
      player2NewMmr: player2.mmr + change2
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const score1 = parseInt(player1Score);
    const score2 = parseInt(player2Score);
    
    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
      return;
    }

    const winner = selectedWinner === match.player1.id ? match.player1 : match.player2;
    const mmrChange = calculateMmrChange(match.player1, match.player2, selectedWinner, score1, score2);

    const updatedMatch: MMRMatch = {
      ...match,
      winner,
      score: {
        player1Score: score1,
        player2Score: score2
      },
      mmrChange
    };

    onUpdateMatch(updatedMatch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Match</DialogTitle>
          <DialogDescription>
            Update the match details. MMR changes will be recalculated automatically.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{match.player1.name} Score</Label>
              <Input
                type="number"
                min="0"
                value={player1Score}
                onChange={(e) => setPlayer1Score(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>{match.player2.name} Score</Label>
              <Input
                type="number"
                min="0"
                value={player2Score}
                onChange={(e) => setPlayer2Score(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label>Winner</Label>
            <Select value={selectedWinner} onValueChange={setSelectedWinner}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={match.player1.id}>{match.player1.name}</SelectItem>
                <SelectItem value={match.player2.id}>{match.player2.name}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Match</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};