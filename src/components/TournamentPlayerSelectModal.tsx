import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trophy, Users } from "lucide-react";
import { Player } from "@/types/tournament";

interface TournamentPlayerSelectModalProps {
  players: Player[];
  onConfirm: (selectedPlayers: Player[]) => void;
  onClose: () => void;
}

export const TournamentPlayerSelectModal = ({ players, onConfirm, onClose }: TournamentPlayerSelectModalProps) => {
  const [selected, setSelected] = useState<Set<string>>(new Set(players.map(p => p.id)));

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === players.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(players.map(p => p.id)));
    }
  };

  const selectedPlayers = players.filter(p => selected.has(p.id));
  const canStart = selectedPlayers.length >= 2;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-5">
          <Trophy className="w-5 h-5 text-table-green" />
          <h3 className="text-xl font-semibold">Select Participants</h3>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {selected.size} of {players.length} selected
          </span>
          <button
            onClick={toggleAll}
            className="text-sm text-primary hover:underline"
          >
            {selected.size === players.length ? "Deselect all" : "Select all"}
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {players.map(player => (
            <div
              key={player.id}
              onClick={() => toggle(player.id)}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer select-none"
            >
              <Checkbox
                checked={selected.has(player.id)}
                onCheckedChange={() => toggle(player.id)}
                onClick={e => e.stopPropagation()}
              />
              <span className="font-medium flex-1">{player.name}</span>
              <span className="text-sm text-muted-foreground">{player.mmr} MMR</span>
            </div>
          ))}
        </div>

        {!canStart && (
          <p className="text-sm text-destructive mt-3">Select at least 2 players.</p>
        )}

        <div className="flex gap-3 mt-5">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedPlayers)}
            disabled={!canStart}
            className="flex-1 bg-table-green hover:bg-table-green/90 text-white"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Start Tournament
          </Button>
        </div>
      </Card>
    </div>
  );
};
