import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Target } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PlayerSidebar } from "@/components/PlayerSidebar";
import { MMRModeContent } from "@/components/MMRModeContent";
import { Player, MMRMatch } from "@/types/tournament";
import { useGroup } from "@/contexts/GroupContext";
import { updateGroup } from "@/services/groupService";

const MMR = () => {
  const { currentGroup } = useGroup();
  const [players, setPlayers] = useState<Player[]>([]);
  const [mmrMatches, setMmrMatches] = useState<MMRMatch[]>([]);

  // Load data from current group
  useEffect(() => {
    if (currentGroup) {
      const playersWithMmr = currentGroup.players.map((player: Player) => ({
        ...player,
        mmr: player.mmr || 1000,
        peakMmr: player.peakMmr || player.mmr || 1000
      }));
      setPlayers(playersWithMmr);
      setMmrMatches(currentGroup.mmrMatches || []);
    } else {
      // Reset state when no group is selected
      setPlayers([]);
      setMmrMatches([]);
    }
  }, [currentGroup]);

  const handleUpdatePlayers = async (updatedPlayers: Player[]) => {
    if (!currentGroup) return;

    // Ensure all players have MMR fields when updated
    const playersWithMmr = updatedPlayers.map(player => ({
      ...player,
      mmr: player.mmr || 1000,
      peakMmr: player.peakMmr || player.mmr || 1000
    }));

    try {
      await updateGroup(currentGroup.id, { players: playersWithMmr });
      setPlayers(playersWithMmr);
    } catch (error) {
      console.error('Failed to update players in group:', error);
    }
  };

  const handleUpdateMatch = async (updatedMatch: MMRMatch) => {
    if (!currentGroup) return;

    try {
      // Find the original match and calculate MMR differences
      const originalMatch = mmrMatches.find(m => m.id === updatedMatch.id);
      if (!originalMatch) return;

      // Revert the original MMR changes
      const revertedPlayers = players.map(player => {
        if (player.id === originalMatch.player1.id) {
          return {
            ...player,
            mmr: player.mmr - originalMatch.mmrChange.player1Change,
            peakMmr: Math.max(player.peakMmr, player.mmr - originalMatch.mmrChange.player1Change)
          };
        }
        if (player.id === originalMatch.player2.id) {
          return {
            ...player,
            mmr: player.mmr - originalMatch.mmrChange.player2Change,
            peakMmr: Math.max(player.peakMmr, player.mmr - originalMatch.mmrChange.player2Change)
          };
        }
        return player;
      });

      // Apply the new MMR changes
      const updatedPlayers = revertedPlayers.map(player => {
        if (player.id === updatedMatch.player1.id) {
          const newMmr = player.mmr + updatedMatch.mmrChange.player1Change;
          return {
            ...player,
            mmr: newMmr,
            peakMmr: Math.max(player.peakMmr, newMmr),
            wins: updatedMatch.winner.id === player.id ? player.wins : player.wins,
            losses: updatedMatch.winner.id !== player.id ? player.losses : player.losses
          };
        }
        if (player.id === updatedMatch.player2.id) {
          const newMmr = player.mmr + updatedMatch.mmrChange.player2Change;
          return {
            ...player,
            mmr: newMmr,
            peakMmr: Math.max(player.peakMmr, newMmr),
            wins: updatedMatch.winner.id === player.id ? player.wins : player.wins,
            losses: updatedMatch.winner.id !== player.id ? player.losses : player.losses
          };
        }
        return player;
      });

      // Update matches array
      const updatedMatches = mmrMatches.map(match =>
        match.id === updatedMatch.id ? updatedMatch : match
      );

      // Update group
      await updateGroup(currentGroup.id, {
        players: updatedPlayers,
        mmrMatches: updatedMatches
      });

      setPlayers(updatedPlayers);
      setMmrMatches(updatedMatches);
    } catch (error) {
      console.error('Failed to update match:', error);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!currentGroup) return;

    try {
      // Find the match to delete
      const matchToDelete = mmrMatches.find(m => m.id === matchId);
      if (!matchToDelete) return;

      // Revert the MMR changes
      const revertedPlayers = players.map(player => {
        if (player.id === matchToDelete.player1.id) {
          return {
            ...player,
            mmr: player.mmr - matchToDelete.mmrChange.player1Change,
            wins: matchToDelete.winner.id === player.id ? player.wins - 1 : player.wins,
            losses: matchToDelete.winner.id !== player.id ? player.losses - 1 : player.losses
          };
        }
        if (player.id === matchToDelete.player2.id) {
          return {
            ...player,
            mmr: player.mmr - matchToDelete.mmrChange.player2Change,
            wins: matchToDelete.winner.id === player.id ? player.wins - 1 : player.wins,
            losses: matchToDelete.winner.id !== player.id ? player.losses - 1 : player.losses
          };
        }
        return player;
      });

      // Remove the match from the array
      const updatedMatches = mmrMatches.filter(match => match.id !== matchId);

      // Update group
      await updateGroup(currentGroup.id, {
        players: revertedPlayers,
        mmrMatches: updatedMatches
      });

      setPlayers(revertedPlayers);
      setMmrMatches(updatedMatches);
    } catch (error) {
      console.error('Failed to delete match:', error);
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
      currentGroup={currentGroup}
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
        onUpdateMatch={handleUpdateMatch}
        onDeleteMatch={handleDeleteMatch}
      />
    </AppLayout>
  );
};

export default MMR;