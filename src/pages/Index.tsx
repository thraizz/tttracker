import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Plus, Trophy, Users, Target, Settings } from "lucide-react";
import { RoomManager } from "@/components/RoomManager";
import { UserAvatar } from "@/components/UserAvatar";
import { AppLayout } from "@/components/AppLayout";
import { PlayerSidebar } from "@/components/PlayerSidebar";
import TournamentBracket from "@/components/TournamentBracket";
import { MMRModeContent } from "@/components/MMRModeContent";
import { Player, Match, Tournament, MMRMatch } from "@/types/tournament";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { updateRoom } from "@/services/roomService";
import { useLegacyDataMigration } from "@/hooks/useLegacyDataMigration";
import { LegacyDataMigrationDialog } from "@/components/LegacyDataMigrationDialog";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentRoom, loading: roomLoading, refreshRooms } = useRoom();
  const { hasLegacyData, legacyData, migrationChecked, clearLegacyData, markMigrationDismissed } = useLegacyDataMigration();
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [view, setView] = useState<'setup' | 'tournament'>('setup');
  const [mmrMatches, setMmrMatches] = useState<MMRMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'tournament' | 'mmr'>('tournament');
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);

  // Load data from current room
  useEffect(() => {
    if (currentRoom) {
      const playersWithMmr = currentRoom.players.map((player: Player) => ({
        ...player,
        mmr: player.mmr || 1000,
        peakMmr: player.peakMmr || player.mmr || 1000
      }));
      setPlayers(playersWithMmr);

      // Load the active tournament from room tournaments
      const activeTournament = currentRoom.tournaments.find(t => t.status === 'active');
      if (activeTournament) {
        setCurrentTournament(activeTournament);
        setView('tournament');
      } else {
        setCurrentTournament(null);
        setView('setup');
      }

      setMmrMatches(currentRoom.mmrMatches || []);
    } else {
      // Reset state when no room is selected
      setPlayers([]);
      setCurrentTournament(null);
      setView('setup');
      setMmrMatches([]);
    }
  }, [currentRoom]);

  // Show migration dialog when legacy data is detected and no current room
  useEffect(() => {
    if (migrationChecked && hasLegacyData && !currentRoom && !roomLoading && !authLoading) {
      setMigrationDialogOpen(true);
    }
  }, [migrationChecked, hasLegacyData, currentRoom, roomLoading, authLoading]);

  const handleMigrationComplete = async () => {
    clearLegacyData();
    await refreshRooms();
  };

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

  const startTournament = async () => {
    if (players.length < 2 || !currentRoom) return;

    const matches = generateMatches(players);
    const tournament: Tournament = {
      id: Date.now().toString(),
      players,
      matches,
      status: 'active',
      createdAt: new Date(),
      currentView: 'next-match'
    };

    try {
      const updatedTournaments = [...currentRoom.tournaments.filter(t => t.status !== 'active'), tournament];
      await updateRoom(currentRoom.id, { tournaments: updatedTournaments });
      setCurrentTournament(tournament);
      setView('tournament');
    } catch (error) {
      console.error('Failed to start tournament:', error);
    }
  };

  const generateMatches = (players: Player[]): Match[] => {
    const matches: Match[] = [];
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

    // Create single elimination bracket
    let currentRound = 1;
    let roundPlayers = [...shuffledPlayers];

    // Add bye players if odd number
    if (roundPlayers.length % 2 === 1) {
      roundPlayers.push({
        id: 'bye',
        name: 'BYE',
        wins: 0,
        losses: 0,
        mmr: 1000,
        peakMmr: 1000
      });
    }

    // Generate bracket rounds
    while (roundPlayers.length > 1) {
      const roundMatches: Match[] = [];

      for (let i = 0; i < roundPlayers.length; i += 2) {
        if (i + 1 < roundPlayers.length) {
          roundMatches.push({
            id: `round-${currentRound}-match-${Math.floor(i / 2)}`,
            player1: roundPlayers[i],
            player2: roundPlayers[i + 1],
            status: 'pending',
            round: currentRound,
            gameMode: 'tournament'
          });
        }
      }

      matches.push(...roundMatches);

      // Prepare for next round (winners will be determined during play)
      roundPlayers = new Array(Math.ceil(roundPlayers.length / 2)).fill(null);
      currentRound++;
    }

    return matches;
  };

  const resetTournament = async () => {
    if (!currentRoom || !currentTournament) return;

    try {
      const updatedTournaments = currentRoom.tournaments.map(t =>
        t.id === currentTournament.id ? { ...t, status: 'completed' as const } : t
      );
      await updateRoom(currentRoom.id, { tournaments: updatedTournaments });
      setCurrentTournament(null);
      setView('setup');
    } catch (error) {
      console.error('Failed to reset tournament:', error);
    }
  };

  // Show loading while authenticating or loading room
  if (authLoading || roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show room selection if no current room
  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-gray to-background">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="text-center mb-8 relative">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-ping-pong to-victory-gold flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-ping-pong to-victory-gold bg-clip-text text-transparent">
                TTTracker
              </h1>
            </div>
            <p className="text-muted-foreground text-lg mb-8">
              Tournament brackets and MMR tracking for your table tennis group
            </p>

            {/* User Avatar and Settings */}
            <div className="absolute top-0 right-0 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <UserAvatar size="sm" />
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user && !user.isAnonymous ? user.displayName || user.email : 'Anonymous'}
                </span>
              </div>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
            </div>
          </div>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-center">Select or Create a Room</h2>
            <RoomManager />
          </Card>
        </div>
      </div>
    );
  }

  // Create sidebar content
  const sidebarContent = (
    <PlayerSidebar
      players={players}
      onUpdatePlayers={handleUpdatePlayers}
      activeTab={activeTab}
      onAddMatch={(match) => setMmrMatches([...mmrMatches, match])}
    />
  );

  // Create quick actions based on current state
  const quickActions = (
    <div className="space-y-2">
      {activeTab === 'tournament' && players.length >= 2 && !currentTournament && (
        <Button
          onClick={startTournament}
          size="sm"
          className="w-full bg-gradient-to-r from-table-green to-secondary hover:from-table-green/90 hover:to-secondary/90 text-white font-semibold"
        >
          <Trophy className="w-4 h-4 mr-2" />
          Start Tournament
        </Button>
      )}

      {activeTab === 'mmr' && players.length >= 2 && (
        <Button size="sm" className="w-full" variant="outline">
          <Target className="w-4 h-4 mr-2" />
          Quick Match
        </Button>
      )}
    </div>
  );

  // Handle tournament bracket view within the layout
  if (view === 'tournament' && currentTournament && activeTab === 'tournament') {
    return (
      <AppLayout
        currentRoom={currentRoom}
        players={players}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentTournament={currentTournament}
        mmrMatches={mmrMatches}
        sidebarContent={sidebarContent}
        quickActions={quickActions}
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
    if (activeTab === 'tournament') {
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
    }

    if (activeTab === 'mmr') {
      return (
        <MMRModeContent
          players={players}
          onUpdatePlayers={handleUpdatePlayers}
          mmrMatches={mmrMatches}
          onAddMatch={(match) => setMmrMatches([...mmrMatches, match])}
        />
      );
    }

    return null;
  };

  return (
    <AppLayout
      currentRoom={currentRoom}
      players={players}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      currentTournament={currentTournament}
      mmrMatches={mmrMatches}
      sidebarContent={sidebarContent}
      quickActions={quickActions}
    >
      {renderMainContent()}

      {/* Legacy Data Migration Dialog */}
      <LegacyDataMigrationDialog
        open={migrationDialogOpen}
        onOpenChange={setMigrationDialogOpen}
        legacyData={legacyData || {}}
        onMigrationComplete={handleMigrationComplete}
        onDismiss={markMigrationDismissed}
      />
    </AppLayout>
  );
};

export default Index;