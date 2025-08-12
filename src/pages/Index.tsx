import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Plus, Trophy, Users, Target, Settings } from "lucide-react";
import { RoomManager } from "@/components/RoomManager";
import PlayerManagement from "@/components/PlayerManagement";
import TournamentBracket from "@/components/TournamentBracket";
import MMRMode from "@/components/MMRMode";
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
          <div className="text-center mb-8">
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
          </div>
          
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-center">Select or Create a Room</h2>
            <RoomManager />
          </Card>
        </div>
      </div>
    );
  }

  if (view === 'tournament' && currentTournament) {
    return (
      <TournamentBracket
        tournament={currentTournament}
        onUpdateTournament={setCurrentTournament}
        onReset={resetTournament}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-gray to-background">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-ping-pong to-victory-gold flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-ping-pong to-victory-gold bg-clip-text text-transparent">
              TTTracker
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Tournament brackets and MMR tracking for your table tennis group
          </p>
          
          {/* Settings Button */}
          <div className="absolute top-0 right-0">
            <Link to="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Room Management */}
        <Card className="p-6 mb-8" style={{ boxShadow: 'var(--shadow-tournament)' }}>
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-ping-pong" />
            <h2 className="text-2xl font-semibold">Room</h2>
          </div>
          <RoomManager />
        </Card>

        {/* Mode Selection Tabs */}
        <Tabs value={activeTab} onValueChange={(value: 'tournament' | 'mmr') => setActiveTab(value)} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="tournament" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tournament
            </TabsTrigger>
            <TabsTrigger value="mmr" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              MMR Mode
            </TabsTrigger>
          </TabsList>

          {/* Player Management Section */}
          <Card className="p-6" style={{ boxShadow: 'var(--shadow-tournament)' }}>
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-ping-pong" />
              <h2 className="text-2xl font-semibold">Players</h2>
              <div className="ml-auto bg-ping-pong/10 text-ping-pong px-3 py-1 rounded-full text-sm font-medium">
                {players.length} registered
              </div>
            </div>
            
            <PlayerManagement players={players} onUpdatePlayers={handleUpdatePlayers} />
          </Card>

          <TabsContent value="tournament" className="space-y-8">
            {/* Start Tournament */}
            {players.length >= 2 && (
              <Card className="p-6 bg-gradient-to-r from-table-green/5 to-secondary/5 border-table-green/20">
                <div className="text-center">
                  <Trophy className="w-12 h-12 text-table-green mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Start Tournament!</h3>
                  <p className="text-muted-foreground mb-6">
                    {players.length} players registered. Create a single-elimination bracket!
                  </p>
                  <Button 
                    onClick={startTournament}
                    size="lg"
                    className="bg-gradient-to-r from-table-green to-secondary hover:from-table-green/90 hover:to-secondary/90 text-white font-semibold px-8"
                  >
                    <Trophy className="w-5 h-5 mr-2" />
                    Start Tournament
                  </Button>
                </div>
              </Card>
            )}

            {players.length < 2 && (
              <Card className="p-6 border-dashed border-2 border-muted">
                <div className="text-center text-muted-foreground">
                  <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Add Players to Begin</h3>
                  <p>You need at least 2 players to start a tournament</p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mmr" className="space-y-8">
            <MMRMode 
              players={players}
              onUpdatePlayers={handleUpdatePlayers}
              mmrMatches={mmrMatches}
              onAddMatch={(match) => setMmrMatches([...mmrMatches, match])}
            />
          </TabsContent>
        </Tabs>

        {/* Legacy Data Migration Dialog */}
        <LegacyDataMigrationDialog
          open={migrationDialogOpen}
          onOpenChange={setMigrationDialogOpen}
          legacyData={legacyData || {}}
          onMigrationComplete={handleMigrationComplete}
          onDismiss={markMigrationDismissed}
        />
      </div>
    </div>
  );
};

export default Index;