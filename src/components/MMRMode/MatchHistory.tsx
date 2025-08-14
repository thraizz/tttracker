import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, TrendingUp, TrendingDown, Edit, Trash2 } from "lucide-react";
import { MMRMatch, Player } from "@/types/tournament";
import { EditMatchModal } from "@/components/EditMatchModal";

interface MatchHistoryProps {
  mmrMatches: MMRMatch[];
  players: Player[];
  onUpdateMatch: (match: MMRMatch) => void;
  onDeleteMatch: (matchId: string) => void;
}

export const MatchHistory = ({ mmrMatches, players, onUpdateMatch, onDeleteMatch }: MatchHistoryProps) => {
  const [editingMatch, setEditingMatch] = useState<MMRMatch | null>(null);

  // Recent matches (last 10)
  const recentMatches = [...mmrMatches].reverse().slice(0, 10);

  return (
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
            <div key={match.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-muted/30 rounded-lg">
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
              <div className="flex items-center gap-2">
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

      {editingMatch && (
        <EditMatchModal
          match={editingMatch}
          players={players}
          open={!!editingMatch}
          onOpenChange={(open) => !open && setEditingMatch(null)}
          onUpdateMatch={onUpdateMatch}
        />
      )}
    </Card>
  );
};