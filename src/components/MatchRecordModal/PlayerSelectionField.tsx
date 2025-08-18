import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Player } from "@/types/tournament";
import { getRankByMmr } from "@/utils/rankSystem";

interface PlayerSelectionFieldProps {
  label: string;
  playerValue: string;
  scoreValue: string;
  onPlayerChange: (value: string) => void;
  onScoreChange: (value: string) => void;
  players: Player[];
  excludePlayerId?: string;
}

export const PlayerSelectionField = ({
  label,
  playerValue,
  scoreValue,
  onPlayerChange,
  onScoreChange,
  players,
  excludePlayerId
}: PlayerSelectionFieldProps) => {
  const availablePlayers = excludePlayerId ? players.filter(p => p.id !== excludePlayerId) : players;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">{label}</label>
        <Select value={playerValue} onValueChange={onPlayerChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {availablePlayers.map(player => {
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
        <label className="text-sm font-medium mb-2 block">{label} Score</label>
        <Input
          type="number"
          placeholder="0"
          value={scoreValue}
          onChange={(e) => onScoreChange(e.target.value)}
          className="text-center text-lg font-semibold"
        />
      </div>
    </div>
  );
};