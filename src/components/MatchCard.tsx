import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, User, Clock } from "lucide-react";
import { Match } from "@/types/tournament";

interface MatchCardProps {
  match: Match;
  onSelectMatch: (match: Match) => void;
}

const MatchCard = ({ match, onSelectMatch }: MatchCardProps) => {
  const isCompleted = match.status === 'completed';

  return (
    <Card
      className={`p-4 transition-all hover:shadow-lg ${isCompleted
        ? 'bg-gradient-to-r from-table-green/5 to-secondary/5 border-table-green/20'
        : 'hover:border-ping-pong/30 cursor-pointer'
        }`}
      onClick={() => !isCompleted && onSelectMatch(match)}
      style={{
        boxShadow: isCompleted ? 'var(--shadow-match)' : undefined
      }}
    >
      <div className="space-y-4">
        {/* Match Header */}
        <div className="flex items-center justify-between">
          <Badge variant={isCompleted ? 'default' : 'secondary'} className="text-xs">
            {isCompleted ? (
              <Trophy className="w-3 h-3 mr-1" />
            ) : (
              <Clock className="w-3 h-3 mr-1" />
            )}
            {isCompleted ? 'Completed' : 'Pending'}
          </Badge>

          <span className="text-xs text-muted-foreground">Round {match.round}</span>
        </div>

        {/* Players */}
        <div className="space-y-3">
          {/* Player 1 */}
          <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isCompleted && match.winner?.id === match.player1?.id
            ? 'bg-victory-gold/10 border border-victory-gold/30'
            : 'bg-muted/50'
            }`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted && match.winner?.id === match.player1?.id
                ? 'bg-victory-gold text-white'
                : 'bg-table-green text-white'
                }`}>
                <User className="w-4 h-4" />
              </div>
              <span className={`font-medium ${isCompleted && match.winner?.id === match.player1?.id ? 'text-victory-gold' : ''
                }`}>
                {match.player1?.name || 'TBD'}
              </span>
            </div>

            {isCompleted && match.score && (
              <span className={`font-bold text-lg ${match.winner?.id === match.player1?.id ? 'text-victory-gold' : 'text-muted-foreground'
                }`}>
                {match.score.player1Score}
              </span>
            )}
          </div>

          {/* VS Divider */}
          <div className="text-center text-muted-foreground text-sm font-medium">
            VS
          </div>

          {/* Player 2 */}
          <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isCompleted && match.winner?.id === match.player2?.id
            ? 'bg-victory-gold/10 border border-victory-gold/30'
            : 'bg-muted/50'
            }`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted && match.winner?.id === match.player2?.id
                ? 'bg-victory-gold text-white'
                : 'bg-table-green text-white'
                }`}>
                <User className="w-4 h-4" />
              </div>
              <span className={`font-medium ${isCompleted && match.winner?.id === match.player2?.id ? 'text-victory-gold' : ''
                }`}>
                {match.player2?.name || 'TBD'}
              </span>
            </div>

            {isCompleted && match.score && (
              <span className={`font-bold text-lg ${match.winner?.id === match.player2?.id ? 'text-victory-gold' : 'text-muted-foreground'
                }`}>
                {match.score.player2Score}
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!isCompleted && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-ping-pong/30 text-ping-pong hover:bg-ping-pong/10"
          >
            Record Result
          </Button>
        )}

        {/* Winner Badge */}
        {isCompleted && match.winner && (
          <div className="text-center">
            <Badge className="bg-victory-gold text-white">
              🏆 {match.winner.name} Wins!
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MatchCard;