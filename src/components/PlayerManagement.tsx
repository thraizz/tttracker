import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, User } from "lucide-react";
import { Player } from "@/types/tournament";

interface PlayerManagementProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
}

const PlayerManagement = ({ players, onUpdatePlayers }: PlayerManagementProps) => {
  const [newPlayerName, setNewPlayerName] = useState("");

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    
    if (players.some(p => p.name.toLowerCase() === newPlayerName.toLowerCase())) {
      return; // Prevent duplicate names
    }

    const newPlayer: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      wins: 0,
      losses: 0,
      mmr: 1000,
      peakMmr: 1000
    };

    onUpdatePlayers([...players, newPlayer]);
    setNewPlayerName("");
  };

  const removePlayer = (playerId: string) => {
    onUpdatePlayers(players.filter(p => p.id !== playerId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addPlayer();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Player Form */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter player name..."
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button 
          onClick={addPlayer}
          disabled={!newPlayerName.trim()}
          className="bg-ping-pong hover:bg-ping-pong/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Players List */}
      {players.length > 0 ? (
        <div className="grid gap-3">
          {players.map((player) => (
            <Card key={player.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-table-green to-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium">{player.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {player.wins}W - {player.losses}L
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      MMR: {player.mmr}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePlayer(player.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No players added yet</p>
          <p className="text-sm">Add some players to get started!</p>
        </div>
      )}
    </div>
  );
};

export default PlayerManagement;