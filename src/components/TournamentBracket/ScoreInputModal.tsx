import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Match } from "@/types/tournament";

interface ScoreInputModalProps {
  match: Match | null;
  onClose: () => void;
  onSubmitScore: (matchId: string, player1Score: number, player2Score: number) => void;
}

export const ScoreInputModal = ({ match, onClose, onSubmitScore }: ScoreInputModalProps) => {
  const [scorePlayer1, setScorePlayer1] = useState("");
  const [scorePlayer2, setScorePlayer2] = useState("");

  if (!match) return null;

  const handleSubmit = () => {
    if (!scorePlayer1 || !scorePlayer2) return;

    const p1Score = parseInt(scorePlayer1);
    const p2Score = parseInt(scorePlayer2);

    if (isNaN(p1Score) || isNaN(p2Score) || p1Score === p2Score) return;

    onSubmitScore(match.id, p1Score, p2Score);
    setScorePlayer1("");
    setScorePlayer2("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md p-6">
        <h3 className="text-xl font-semibold mb-4 text-center">Record Match Result</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">{match.player1.name}</span>
            <Input
              type="number"
              placeholder="Score"
              value={scorePlayer1}
              onChange={(e) => setScorePlayer1(e.target.value)}
              className="w-20 text-center"
            />
          </div>

          <div className="text-center text-muted-foreground">VS</div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">{match.player2.name}</span>
            <Input
              type="number"
              placeholder="Score"
              value={scorePlayer2}
              onChange={(e) => setScorePlayer2(e.target.value)}
              className="w-20 text-center"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!scorePlayer1 || !scorePlayer2 || parseInt(scorePlayer1) === parseInt(scorePlayer2)}
            className="flex-1 bg-table-green hover:bg-table-green/90 text-white"
          >
            Record Result
          </Button>
        </div>
      </Card>
    </div>
  );
};