import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PlayerSidebar } from "@/components/PlayerSidebar";
import { MMRModeContent } from "@/components/MMRModeContent";
import { Player, MMRMatch } from "@/types/tournament";
import { useRoom } from "@/contexts/RoomContext";
import { updateRoom } from "@/services/roomService";

const MMR = () => {
  const { currentRoom } = useRoom();
  const [players, setPlayers] = useState<Player[]>([]);
  const [mmrMatches, setMmrMatches] = useState<MMRMatch[]>([]);

  // Load data from current room
  useEffect(() => {
    if (currentRoom) {
      const playersWithMmr = currentRoom.players.map((player: Player) => ({
        ...player,
        mmr: player.mmr || 1000,
        peakMmr: player.peakMmr || player.mmr || 1000
      }));
      setPlayers(playersWithMmr);
      setMmrMatches(currentRoom.mmrMatches || []);
    } else {
      // Reset state when no room is selected
      setPlayers([]);
      setMmrMatches([]);
    }
  }, [currentRoom]);

  const handleUpdatePlayers = async (updatedPlayers: Player[]) => {
    if (!currentRoom) return;

    // Ensure all players have MMR fields when updated
    const playersWithMmr = updatedPlayers.map(player => ({
      ...player,
      mmr: player.mmr || 1000,
      peakMmr: player.peakMmr || player.mmr || 1000
    }));

    try {
      await updateRoom(currentRoom.id, { players: playersWithMmr });
      setPlayers(playersWithMmr);
    } catch (error) {
      console.error('Failed to update players in room:', error);
    }
  };

  // Create sidebar content
  const sidebarContent = (
    <PlayerSidebar
      players={players}
      onUpdatePlayers={handleUpdatePlayers}
      onAddMatch={(match) => setMmrMatches([...mmrMatches, match])}
    />
  );

  // Create quick actions based on current state
  const quickActions = (
    <div className="space-y-2">
      {players.length >= 2 && (
        <Button size="sm" className="w-full" variant="outline">
          <Target className="w-4 h-4 mr-2" />
          Quick Match
        </Button>
      )}
    </div>
  );

  return (
    <AppLayout
      currentRoom={currentRoom}
      players={players}
      currentTournament={null}
      mmrMatches={mmrMatches}
      sidebarContent={sidebarContent}
      quickActions={quickActions}
    >
      <MMRModeContent
        players={players}
        onUpdatePlayers={handleUpdatePlayers}
        mmrMatches={mmrMatches}
        onAddMatch={(match) => setMmrMatches([...mmrMatches, match])}
      />
    </AppLayout>
  );
};

export default MMR;