import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, User, Link } from "lucide-react";
import { Player } from "@/types/tournament";
import { getRankByMmrWithContrast, formatRankDisplay } from "@/utils/rankSystem";
import { useTheme } from "@/hooks/useTheme";
import type { User as FirebaseUser } from "firebase/auth";

interface PlayerManagementProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  currentUser?: FirebaseUser | null;
  userIsLinked?: boolean;
  onLinkPlayer?: (playerId: string) => void;
}

const PlayerManagement = ({ players, onUpdatePlayers, currentUser, userIsLinked, onLinkPlayer }: PlayerManagementProps) => {
  const [newPlayerName, setNewPlayerName] = useState("");
  const isDark = useTheme();

  // Check if a player ID is numerical (not linked to a Google account)
  const isPlayerUnlinked = (playerId: string) => {
    return /^\d+$/.test(playerId);
  };

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
    <div className="space-y-4 m-4">
      {/* User Not Linked Notification */}
      {currentUser && !userIsLinked && players.some(p => isPlayerUnlinked(p.id)) && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Link className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-900">Link Your Account</h4>
              <p className="text-sm text-blue-700">
                Link an existing player to your account to prefill match forms and track your stats. Click "Link" next to any unlinked player.
              </p>
            </div>
          </div>
        </Card>
      )}

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
          {players.map((player) => {
            const rank = getRankByMmrWithContrast(player.mmr, isDark);
            return (
              <Card key={player.id} className="p-4 flex items-center justify-between hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${rank.originalColor}, ${rank.originalColor}AA)`,
                      boxShadow: `0 4px 12px ${rank.originalColor}30`
                    }}
                  >
                    {rank.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{player.name}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium"
                        style={{
                          backgroundColor: `${rank.contrastSafeColor}20`,
                          color: rank.contrastSafeColor,
                          border: `1px solid ${rank.contrastSafeColor}40`
                        }}
                      >
                        {rank.name}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {player.wins}W - {player.losses}L
                      </Badge>
                      <Badge variant="outline" className="text-xs font-medium">
                        {player.mmr} MMR
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Link Button - Only show if user is logged in and this player is unlinked (numerical ID) and this user has no player assigned to them*/}
                  {currentUser && isPlayerUnlinked(player.id) && onLinkPlayer && !userIsLinked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLinkPlayer(player.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <Link className="w-4 h-4 mr-1" />
                      Link
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Player</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{player.name}"? This action cannot be undone and will remove all associated data including match history and statistics.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removePlayer(player.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            );
          })}
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