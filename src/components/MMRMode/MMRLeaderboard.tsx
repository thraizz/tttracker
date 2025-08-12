import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Player } from "@/types/tournament";
import { getRankByMmr, getRankProgress } from "@/utils/rankSystem";

interface MMRLeaderboardProps {
  players: Player[];
}

export const MMRLeaderboard = ({ players }: MMRLeaderboardProps) => {
  // Sort players by MMR for leaderboard
  const leaderboard = [...players].sort((a, b) => b.mmr - a.mmr);

  return (
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
  );
};