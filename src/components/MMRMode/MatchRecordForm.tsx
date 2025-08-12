import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Target } from "lucide-react";
import { Player, MMRMatch } from "@/types/tournament";
import { useRoom } from "@/contexts/RoomContext";
import { updateRoom } from "@/services/roomService";
import { getRankByMmr } from "@/utils/rankSystem";
import { calculateEloChange } from "@/utils/eloUtils";

interface MatchRecordFormProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  mmrMatches: MMRMatch[];
  onAddMatch: (match: MMRMatch) => void;
}

export const MatchRecordForm = ({ players, onUpdatePlayers, mmrMatches, onAddMatch }: MatchRecordFormProps) => {
  const { currentRoom } = useRoom();
  const { toast } = useToast();
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>("");
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>("");
  const [scorePlayer1, setScorePlayer1] = useState("");
  const [scorePlayer2, setScorePlayer2] = useState("");
  const [recording, setRecording] = useState(false);


  const recordMatch = async () => {
    if (!selectedPlayer1 || !selectedPlayer2 || !scorePlayer1 || !scorePlayer2) return;
    if (selectedPlayer1 === selectedPlayer2) return;
    if (!currentRoom) {
      toast({ title: 'Error', description: 'No room selected', variant: 'destructive' });
      return;
    }
    
    const p1Score = parseInt(scorePlayer1);
    const p2Score = parseInt(scorePlayer2);
    
    if (isNaN(p1Score) || isNaN(p2Score) || p1Score === p2Score) return;
    
    const player1 = players.find(p => p.id === selectedPlayer1);
    const player2 = players.find(p => p.id === selectedPlayer2);
    
    if (!player1 || !player2) return;

    setRecording(true);
    
    try {
      const winner = p1Score > p2Score ? player1 : player2;
      const result1 = p1Score > p2Score ? 1 : 0;
      const result2 = 1 - result1;

      const change1 = calculateEloChange(player1.mmr, player2.mmr, result1);
      const change2 = calculateEloChange(player2.mmr, player1.mmr, result2);

      const newMmr1 = Math.max(0, player1.mmr + change1);
      const newMmr2 = Math.max(0, player2.mmr + change2);

      // Create match record
      const match: MMRMatch = {
        id: `mmr-${Date.now()}`,
        player1,
        player2,
        winner,
        score: {
          player1Score: p1Score,
          player2Score: p2Score
        },
        mmrChange: {
          player1Change: change1,
          player2Change: change2,
          player1NewMmr: newMmr1,
          player2NewMmr: newMmr2
        },
        completedAt: new Date(),
        roomId: currentRoom.id
      };

      // Update players
      const updatedPlayers = players.map(player => {
        if (player.id === player1.id) {
          return {
            ...player,
            mmr: newMmr1,
            peakMmr: Math.max(player.peakMmr, newMmr1),
            wins: result1 === 1 ? player.wins + 1 : player.wins,
            losses: result1 === 0 ? player.losses + 1 : player.losses
          };
        }
        if (player.id === player2.id) {
          return {
            ...player,
            mmr: newMmr2,
            peakMmr: Math.max(player.peakMmr, newMmr2),
            wins: result2 === 1 ? player.wins + 1 : player.wins,
            losses: result2 === 0 ? player.losses + 1 : player.losses
          };
        }
        return player;
      });

      const updatedMatches = [...mmrMatches, match];

      // Update room in Firebase
      await updateRoom(currentRoom.id, {
        players: updatedPlayers,
        mmrMatches: updatedMatches
      });

      // Update local state
      onUpdatePlayers(updatedPlayers);
      onAddMatch(match);

      // Reset form
      setSelectedPlayer1("");
      setSelectedPlayer2("");
      setScorePlayer1("");
      setScorePlayer2("");

      toast({ title: 'Success', description: 'Match recorded successfully!' });
    } catch (error) {
      console.error('Error recording match:', error);
      toast({ title: 'Error', description: 'Failed to record match', variant: 'destructive' });
    } finally {
      setRecording(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-5 h-5 text-ping-pong" />
        <h2 className="text-xl font-semibold">Record New Match</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Player 1</label>
            <Select value={selectedPlayer1} onValueChange={setSelectedPlayer1}>
              <SelectTrigger>
                <SelectValue placeholder="Select player 1" />
              </SelectTrigger>
              <SelectContent>
                {players.map(player => {
                  const rank = getRankByMmr(player.mmr);
                  return (
                    <SelectItem key={player.id} value={player.id}>
                      <div className="flex items-center gap-2">
                        <span>{rank.icon}</span>
                        <span>{player.name}</span>
                        <span className="text-muted-foreground">({player.mmr} MMR)</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Player 1 Score</label>
            <Input
              type="number"
              placeholder="0"
              value={scorePlayer1}
              onChange={(e) => setScorePlayer1(e.target.value)}
              className="text-center text-lg font-semibold"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Player 2</label>
            <Select value={selectedPlayer2} onValueChange={setSelectedPlayer2}>
              <SelectTrigger>
                <SelectValue placeholder="Select player 2" />
              </SelectTrigger>
              <SelectContent>
                {players.filter(p => p.id !== selectedPlayer1).map(player => {
                  const rank = getRankByMmr(player.mmr);
                  return (
                    <SelectItem key={player.id} value={player.id}>
                      <div className="flex items-center gap-2">
                        <span>{rank.icon}</span>
                        <span>{player.name}</span>
                        <span className="text-muted-foreground">({player.mmr} MMR)</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Player 2 Score</label>
            <Input
              type="number"
              placeholder="0"
              value={scorePlayer2}
              onChange={(e) => setScorePlayer2(e.target.value)}
              className="text-center text-lg font-semibold"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button
          onClick={recordMatch}
          disabled={recording || !selectedPlayer1 || !selectedPlayer2 || !scorePlayer1 || !scorePlayer2 || selectedPlayer1 === selectedPlayer2 || parseInt(scorePlayer1) === parseInt(scorePlayer2)}
          className="bg-gradient-to-r from-table-green to-secondary hover:from-table-green/90 hover:to-secondary/90 text-white font-semibold px-8"
          size="lg"
        >
          <Target className="w-5 h-5 mr-2" />
          {recording ? 'Recording...' : 'Record Match'}
        </Button>
      </div>
    </Card>
  );
};