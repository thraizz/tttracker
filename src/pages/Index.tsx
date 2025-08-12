import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trophy, Users, Target } from "lucide-react";
import PlayerManagement from "@/components/PlayerManagement";
import TournamentBracket from "@/components/TournamentBracket";
import MMRMode from "@/components/MMRMode";
import { Player, Match, Tournament, MMRMatch } from "@/types/tournament";

const Index = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [view, setView] = useState<'setup' | 'tournament'>('setup');
  const [mmrMatches, setMmrMatches] = useState<MMRMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'tournament' | 'mmr'>('tournament');

  // Save data to localStorage
  const saveToLocalStorage = (key: string, data: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  };

  // Load data from localStorage
  const loadFromLocalStorage = (key: string) => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (key === 'currentTournament' && parsed) {
          if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
          if (parsed.completedAt) parsed.completedAt = new Date(parsed.completedAt);
          if (parsed.matches) {
            parsed.matches.forEach((match: Match) => {
              if (match.completedAt) match.completedAt = new Date(match.completedAt);
            });
          }
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  };

  // Load initial data on component mount
  useEffect(() => {
    const savedPlayers = loadFromLocalStorage('players');
    const savedTournament = loadFromLocalStorage('currentTournament');
    const savedView = loadFromLocalStorage('view');
    const savedMmrMatches = loadFromLocalStorage('mmrMatches');
    const savedActiveTab = loadFromLocalStorage('activeTab');

    if (savedPlayers) {
      // Ensure players have MMR fields
      const playersWithMmr = savedPlayers.map((player: Player) => ({
        ...player,
        mmr: player.mmr || 1000,
        peakMmr: player.peakMmr || player.mmr || 1000
      }));
      setPlayers(playersWithMmr);
    }
    if (savedTournament) {
      setCurrentTournament(savedTournament);
    }
    if (savedView && (savedView === 'setup' || savedView === 'tournament')) {
      setView(savedView);
    }
    if (savedMmrMatches) {
      setMmrMatches(savedMmrMatches);
    }
    if (savedActiveTab && (savedActiveTab === 'tournament' || savedActiveTab === 'mmr')) {
      setActiveTab(savedActiveTab);
    }
  }, []);

  // Save players to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage('players', players);
  }, [players]);

  // Save tournament to localStorage whenever it changes
  useEffect(() => {
    if (currentTournament) {
      saveToLocalStorage('currentTournament', currentTournament);
    } else {
      localStorage.removeItem('currentTournament');
    }
  }, [currentTournament]);

  // Save view to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage('view', view);
  }, [view]);

  // Save MMR matches to localStorage whenever they change
  useEffect(() => {
    saveToLocalStorage('mmrMatches', mmrMatches);
  }, [mmrMatches]);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    saveToLocalStorage('activeTab', activeTab);
  }, [activeTab]);

  const handleUpdatePlayers = (updatedPlayers: Player[]) => {
    // Ensure all players have MMR fields when updated
    const playersWithMmr = updatedPlayers.map(player => ({
      ...player,
      mmr: player.mmr || 1000,
      peakMmr: player.peakMmr || player.mmr || 1000
    }));
    setPlayers(playersWithMmr);
  };

  const startTournament = () => {
    if (players.length < 2) return;

    const matches = generateMatches(players);
    const tournament: Tournament = {
      id: Date.now().toString(),
      players,
      matches,
      status: 'active',
      createdAt: new Date(),
      currentView: 'next-match'
    };

    setCurrentTournament(tournament);
    setView('tournament');
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

  const resetTournament = () => {
    setCurrentTournament(null);
    setView('setup');
  };

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
        <div className="text-center mb-8">
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
        </div>

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
      </div>
    </div>
  );
};

export default Index;