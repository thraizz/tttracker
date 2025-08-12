import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Target, Trophy, History, TrendingUp, TrendingDown, Plus, Users } from "lucide-react";
import { Player, MMRMatch } from "@/types/tournament";
import { useRoom } from "@/contexts/RoomContext";
import { updateRoom } from "@/services/roomService";
import { getRankByMmr, getRankProgress, formatRankDisplay } from "@/utils/rankSystem";

interface MMRModeProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  mmrMatches: MMRMatch[];
  onAddMatch: (match: MMRMatch) => void;
}

const MMRMode = ({ players, onUpdatePlayers, mmrMatches, onAddMatch }: MMRModeProps) => {
  const { currentRoom } = useRoom();
  const { toast } = useToast();
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>("");
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>("");
  const [scorePlayer1, setScorePlayer1] = useState("");
  const [scorePlayer2, setScorePlayer2] = useState("");
  const [recording, setRecording] = useState(false);

  // ELO rating calculation
  const calculateEloChange = (ratingA: number, ratingB: number, result: number, kFactor = 32) => {
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const change = Math.round(kFactor * (result - expectedA));
    return change;
  };

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

  // Sort players by MMR for leaderboard
  const leaderboard = [...players].sort((a, b) => b.mmr - a.mmr);

  // Recent matches (last 10)
  const recentMatches = [...mmrMatches].reverse().slice(0, 10);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return "🥇";
      case 1: return "🥈";
      case 2: return "🥉";
      default: return `#${index + 1}`;
    }
  };

  if (players.length < 2) {
    return (
      <Card className="p-8 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Need More Players</h3>
        <p className="text-muted-foreground">Add at least 2 players to start tracking MMR matches.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="record" className="space-y-6">
        <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3">
          <TabsTrigger value="record" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Record Match
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Match History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record">
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
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-5 h-5 text-victory-gold" />
              <h2 className="text-xl font-semibold">MMR Leaderboard</h2>
            </div>

            <div className="space-y-4">
              {leaderboard.map((player, index) => {
                const rank = getRankByMmr(player.mmr);
                const rankProgress = getRankProgress(player.mmr);
                return (
                  <div
                    key={player.id}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                      index === 0 
                        ? 'bg-gradient-to-r from-victory-gold/20 via-victory-gold/10 to-victory-gold/20 border-victory-gold/50 shadow-lg' 
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-300/20 via-gray-300/10 to-gray-300/20 border-gray-300/50 shadow-md'
                        : index === 2
                        ? 'bg-gradient-to-r from-amber-600/20 via-amber-600/10 to-amber-600/20 border-amber-600/50 shadow-md'
                        : 'bg-gradient-to-r from-muted/50 to-muted/30 border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`}
                    style={{
                      background: index > 2 ? `linear-gradient(135deg, ${rank.color}15, ${rank.color}05)` : undefined,
                      borderColor: index > 2 ? `${rank.color}30` : undefined
                    }}
                  >
                    {/* Rank position badge */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-background border-2 border-current flex items-center justify-center font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank icon with glow effect */}
                        <div className="relative">
                          <div 
                            className="text-4xl filter drop-shadow-lg"
                            style={{ 
                              filter: `drop-shadow(0 0 8px ${rank.color}50)` 
                            }}
                          >
                            {rank.icon}
                          </div>
                          <div className="absolute inset-0 text-4xl animate-pulse opacity-30">
                            {rank.icon}
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="font-bold text-xl">{player.name}</div>
                          <div className="flex items-center gap-3">
                            <span 
                              className="font-semibold text-sm px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: `${rank.color}20`, 
                                color: rank.color,
                                border: `1px solid ${rank.color}40`
                              }}
                            >
                              {rank.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {player.wins}W - {player.losses}L
                            </span>
                          </div>
                          
                          {/* Progress bar for rank advancement */}
                          {rankProgress.nextRank && (
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Progress to {rankProgress.nextRank.name}
                                </span>
                                <span className="font-medium">{rankProgress.progress}%</span>
                              </div>
                              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full transition-all duration-500 rounded-full"
                                  style={{ 
                                    width: `${rankProgress.progress}%`,
                                    background: `linear-gradient(90deg, ${rank.color}, ${rankProgress.nextRank.color})`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="text-3xl font-bold bg-gradient-to-r from-ping-pong to-table-green bg-clip-text text-transparent">
                          {player.mmr}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">MMR</div>
                        <div className="text-xs text-muted-foreground">
                          Peak: {player.peakMmr}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <History className="w-5 h-5 text-ping-pong" />
              <h2 className="text-xl font-semibold">Recent Matches</h2>
              <Badge variant="secondary">{mmrMatches.length} total</Badge>
            </div>

            {recentMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No matches recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="font-semibold">{match.player1.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {match.mmrChange.player1Change > 0 ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              +{match.mmrChange.player1Change}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              {match.mmrChange.player1Change}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-center px-4">
                        <div className="font-bold text-lg">
                          {match.score.player1Score} - {match.score.player2Score}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(match.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{match.player2.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {match.mmrChange.player2Change > 0 ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              +{match.mmrChange.player2Change}
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <TrendingDown className="w-3 h-3" />
                              {match.mmrChange.player2Change}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={match.winner.id === match.player1.id ? "default" : "secondary"}>
                        {match.winner.name} wins
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MMRMode;