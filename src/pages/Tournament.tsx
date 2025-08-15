import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trophy } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { PlayerSidebar } from "@/components/PlayerSidebar";
import TournamentBracket from "@/components/TournamentBracket";
import { Player, Tournament as TournamentType, MMRMatch } from "@/types/tournament";
import { useGroup } from "@/contexts/GroupContext";
import { updateGroup } from "@/services/groupService";
import { generateMatches } from "@/utils/tournamentUtils";

const Tournament = () => {
  const { currentGroup } = useGroup();
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTournament, setCurrentTournament] = useState<TournamentType | null>(null);
  const [view, setView] = useState<'setup' | 'tournament'>('setup');
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

      // Load the active tournament from group tournaments
      const activeTournament = currentGroup.tournaments.find(t => t.status === 'active');
      if (activeTournament) {
        setCurrentTournament(activeTournament);
        setView('tournament');
      } else {
        setCurrentTournament(null);
        setView('setup');
      }

      setMmrMatches(currentGroup.mmrMatches || []);
    } else {
      // Reset state when no group is selected
      setPlayers([]);
      setCurrentTournament(null);
      setView('setup');
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

  const startTournament = async () => {
    if (players.length < 2 || !currentGroup) return;

    const matches = generateMatches(players);
    const tournament: TournamentType = {
      id: Date.now().toString(),
      players,
      matches,
      status: 'active',
      createdAt: new Date(),
      currentView: 'next-match'
    };

    try {
      const updatedTournaments = [...currentGroup.tournaments.filter(t => t.status !== 'active'), tournament];
      await updateGroup(currentGroup.id, { tournaments: updatedTournaments });
      setCurrentTournament(tournament);
      setView('tournament');
    } catch (error) {
      console.error('Failed to start tournament:', error);
    }
  };


  const resetTournament = async () => {
    if (!currentGroup || !currentTournament) return;

    try {
      const updatedTournaments = currentGroup.tournaments.map(t =>
        t.id === currentTournament.id ? { ...t, status: 'completed' as const } : t
      );
      await updateGroup(currentGroup.id, { tournaments: updatedTournaments });
      setCurrentTournament(null);
      setView('setup');
    } catch (error) {
      console.error('Failed to reset tournament:', error);
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


  // Handle tournament bracket view within the layout
  if (view === 'tournament' && currentTournament) {
    return (
      <AppLayout
        currentGroup={currentGroup}
        players={players}
        currentTournament={currentTournament}
        mmrMatches={mmrMatches}
        sidebarContent={sidebarContent}
      >
        <TournamentBracket
          tournament={currentTournament}
          onUpdateTournament={setCurrentTournament}
          onReset={resetTournament}
        />
      </AppLayout>
    );
  }

  const renderMainContent = () => {
    if (players.length < 2) {
      return (
        <Card className="p-8 text-center">
          <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Add Players to Begin</h3>
          <p className="text-muted-foreground">You need at least 2 players to start a tournament</p>
        </Card>
      );
    }

    if (!currentTournament) {
      return (
        <Card className="p-8 bg-gradient-to-r from-table-green/5 to-secondary/5 border-table-green/20">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-table-green mx-auto mb-6" />
            <h3 className="text-2xl font-semibold mb-4">Ready to Start Tournament!</h3>
            <p className="text-muted-foreground text-lg mb-8">
              {players.length} players registered. Create a single-elimination bracket!
            </p>
            <Button
              onClick={startTournament}
              size="lg"
              className="bg-gradient-to-r from-table-green to-secondary hover:from-table-green/90 hover:to-secondary/90 text-white font-semibold px-8 py-3 text-lg"
            >
              <Trophy className="w-6 h-6 mr-3" />
              Start Tournament
            </Button>
          </div>
        </Card>
      );
    }

    return null;
  };

  return (
    <AppLayout
      currentGroup={currentGroup}
      players={players}
      currentTournament={currentTournament}
      mmrMatches={mmrMatches}
      sidebarContent={sidebarContent}
    >
      {renderMainContent()}
    </AppLayout>
  );
};

export default Tournament;