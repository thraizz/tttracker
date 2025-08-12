import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Trophy, Target, Settings2 } from "lucide-react";
import { Player, MMRMatch } from "@/types/tournament";
import PlayerManagement from "@/components/PlayerManagement";
import { MatchRecordModal } from "@/components/MatchRecordModal";
import { getRankByMmr } from "@/utils/rankSystem";

interface PlayerSidebarProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  activeTab: 'tournament' | 'mmr';
  quickActions?: React.ReactNode;
  onAddMatch?: (match: MMRMatch) => void;
}

export const PlayerSidebar = ({
  players,
  onUpdatePlayers,
  activeTab,
  quickActions,
  onAddMatch
}: PlayerSidebarProps) => {
  const [playerManagementOpen, setPlayerManagementOpen] = useState(false);

  const topPlayers = [...players]
    .sort((a, b) => b.mmr - a.mmr)
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      {/* Players Section */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-ping-pong" />
            <span className="font-medium text-sm">Players</span>
            <Badge variant="secondary" className="text-xs">
              {players.length}
            </Badge>
          </div>

          <Dialog open={playerManagementOpen} onOpenChange={setPlayerManagementOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <PlayerManagement
                players={players}
                onUpdatePlayers={onUpdatePlayers}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Player List */}
        {players.length === 0 ? (
          <Card className="p-4 text-center">
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No players registered</p>
            <Dialog open={playerManagementOpen} onOpenChange={setPlayerManagementOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Players
                </Button>
              </DialogTrigger>
            </Dialog>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeTab === 'mmr' ? (
              // MMR Mode: Show top players with rankings
              topPlayers.map((player, index) => {
                const rank = getRankByMmr(player.mmr);
                return (
                  <Card key={player.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{rank.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{player.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {player.mmr} MMR
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </Card>
                );
              })
            ) : (
              // Tournament Mode: Show all players with stats
              players.map((player) => (
                <Card key={player.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {player.wins}W - {player.losses}L
                      </div>
                    </div>
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              ))
            )}

            {players.length > 5 && activeTab === 'mmr' && (
              <div className="text-center pt-2">
                <Dialog open={playerManagementOpen} onOpenChange={setPlayerManagementOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All ({players.length}) Players
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="mt-auto p-4 border-t">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-ping-pong" />
            <span className="font-medium text-sm">Quick Actions</span>
          </div>

          {activeTab === 'mmr' && players.length >= 2 && onAddMatch && (
            <MatchRecordModal
              players={players}
              onUpdatePlayers={onUpdatePlayers}
              onAddMatch={onAddMatch}
              trigger={
                <Button size="sm" className="w-full">
                  <Target className="w-4 h-4 mr-2" />
                  Quick Match
                </Button>
              }
            />
          )}

          {quickActions}
        </div>
      </div>
    </div>
  );
};