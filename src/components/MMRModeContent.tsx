import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, History, TrendingUp, TrendingDown, Users, Edit, Trash2 } from "lucide-react";
import { Player, MMRMatch } from "@/types/tournament";
import { MatchRecordModal } from "@/components/MatchRecordModal";
import { getRankByMmrWithContrast, getRankProgress, getRankColorForTheme } from "@/utils/rankSystem";
import { MMRDisplay } from "@/components/MMRDisplay";
import { useTheme } from "@/hooks/useTheme";
import { EditMatchModal } from "@/components/EditMatchModal";

interface MMRModeContentProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  mmrMatches: MMRMatch[];
  onAddMatch: (match: MMRMatch) => void;
  onUpdateMatch: (match: MMRMatch) => void;
  onDeleteMatch: (matchId: string) => void;
}

export const MMRModeContent = ({ players, onUpdatePlayers, mmrMatches, onAddMatch, onUpdateMatch, onDeleteMatch }: MMRModeContentProps) => {
  const isDark = useTheme();
  const [editingMatch, setEditingMatch] = useState<MMRMatch | null>(null);

  // Sort players by MMR for leaderboard
  const leaderboard = [...players].sort((a, b) => b.mmr - a.mmr);

  // Recent matches (last 10)
  const recentMatches = [...mmrMatches].reverse().slice(0, 10);

  if (players.length < 2) {
    return (
      <Card className="p-8 text-center">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Need More Players</h3>
        <p className="text-muted-foreground mb-6">Add at least 2 players to start tracking MMR matches.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="leaderboard" className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-2 justify-between">
          <TabsList className="grid grid-cols-2 w-fit">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Match History
            </TabsTrigger>
          </TabsList>

          <div className="w-fit">
            <MatchRecordModal
              players={players}
              onUpdatePlayers={onUpdatePlayers}
              onAddMatch={onAddMatch}
            />
          </div>
        </div>

        <TabsContent value="leaderboard">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-5 h-5 text-victory-gold" />
              <h2 className="text-xl font-semibold">MMR Leaderboard</h2>
            </div>

            <div className="space-y-4">
              {leaderboard.map((player, index) => {
                const rank = getRankByMmrWithContrast(player.mmr, isDark);
                const rankProgress = getRankProgress(player.mmr);
                return (
                  <div
                    key={player.id}
                    className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${index === 0
                      ? 'bg-gradient-to-r from-victory-gold/20 via-victory-gold/10 to-victory-gold/20 border-victory-gold/50 shadow-lg'
                      : index === 1
                        ? 'bg-gradient-to-r from-gray-300/20 via-gray-300/10 to-gray-300/20 border-gray-300/50 shadow-md'
                        : index === 2
                          ? 'bg-gradient-to-r from-amber-600/20 via-amber-600/10 to-amber-600/20 border-amber-600/50 shadow-md'
                          : 'bg-gradient-to-r from-muted/50 to-muted/30 border-muted-foreground/20 hover:border-muted-foreground/40'
                      }`}
                    style={{
                      background: index > 2 ? `linear-gradient(135deg, ${rank.originalColor}15, ${rank.originalColor}05)` : undefined,
                      borderColor: index > 2 ? `${rank.originalColor}30` : undefined
                    }}
                  >
                    {/* Rank position badge */}
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-background border-2 border-current flex items-center justify-center font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>

                    <div className="flex items-center justify-between ">
                      <div className="flex items-center gap-4">
                        {/* Rank icon with glow effect */}
                        <div className="relative hidden md:block">
                          <div
                            className="text-4xl filter drop-shadow-lg"
                            style={{
                              filter: `drop-shadow(0 0 8px ${rank.originalColor}50)`
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
                                backgroundColor: `${rank.contrastSafeColor}20`,
                                color: rank.contrastSafeColor,
                                border: `1px solid ${rank.contrastSafeColor}40`
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
                            <div className="mt-2 space-y-1 hidden md:block">
                              <div className="flex items-center justify-between text-xs gap-2">
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
                                    background: `linear-gradient(90deg, ${rank.contrastSafeColor}, ${getRankColorForTheme(rankProgress.nextRank, isDark)})`
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <MMRDisplay mmr={player.mmr} peakMmr={player.peakMmr} />
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
                  <div key={match.id} className="flex flex-col-reverse md:flex-row gap-4 items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
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
                          {new Date(match.completedAt).toLocaleTimeString('en-US', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
                    <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-fit">
                      <Badge variant={match.winner.id === match.player1.id ? "default" : "secondary"}>
                        {match.winner.name} wins
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingMatch(match)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onDeleteMatch(match.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          players={players}
          open={!!editingMatch}
          onOpenChange={(open) => !open && setEditingMatch(null)}
          onUpdateMatch={onUpdateMatch}
        />
      )}
    </div>
  );
};