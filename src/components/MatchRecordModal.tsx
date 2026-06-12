import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Target, Users } from "lucide-react";
import { Player, MMRMatch } from "@/types/tournament";
import { useGroup } from "@/contexts/GroupContext";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateGroup } from "@/services/groupService";
import { calculateEloChange } from "@/utils/eloUtils";
import { PlayerSelectionField } from "./MatchRecordModal/PlayerSelectionField";
import { SkunkedAnimation } from "./MatchRecordModal/SkunkedAnimation";
import { getRankByMmr } from "@/utils/rankSystem";

interface MatchRecordModalProps {
  players: Player[];
  onUpdatePlayers: (players: Player[]) => void;
  onAddMatch: (match: MMRMatch) => void;
  trigger?: React.ReactNode;
}

type MatchType = '1v1' | '2v2';

export const MatchRecordModal = ({
  players,
  onUpdatePlayers,
  onAddMatch,
  trigger
}: MatchRecordModalProps) => {
  const { currentGroup } = useGroup();
  const { user } = useAuth();
  const { toast } = useToast();
  const { matchRecordModalOpen, setMatchRecordModalOpen } = useModal();

  const [matchType, setMatchType] = useState<MatchType>('1v1');

  // 1v1 state
  const [selectedPlayer1, setSelectedPlayer1] = useState<string>("");
  const [selectedPlayer2, setSelectedPlayer2] = useState<string>("");
  const [scorePlayer1, setScorePlayer1] = useState("");
  const [scorePlayer2, setScorePlayer2] = useState("");

  // 2v2 extra state (team1P1 = selectedPlayer1, team2P1 = selectedPlayer2)
  const [selectedTeam1P2, setSelectedTeam1P2] = useState<string>("");
  const [selectedTeam2P2, setSelectedTeam2P2] = useState<string>("");

  const [recording, setRecording] = useState(false);
  const [showSkunkedAnimation, setShowSkunkedAnimation] = useState(false);

  const checkForSkunkedScore = (score1: string, score2: string) => {
    const p1Score = parseInt(score1);
    const p2Score = parseInt(score2);
    if (isNaN(p1Score) || isNaN(p2Score)) return false;
    return (p1Score === 0 && p2Score > 0) || (p2Score === 0 && p1Score > 0);
  };

  const resetForm = () => {
    setSelectedPlayer1("");
    setSelectedPlayer2("");
    setScorePlayer1("");
    setScorePlayer2("");
    setSelectedTeam1P2("");
    setSelectedTeam2P2("");
    setShowSkunkedAnimation(false);
  };

  const recordMatch1v1 = async () => {
    if (!selectedPlayer1 || !selectedPlayer2) return;
    if (selectedPlayer1 === selectedPlayer2) return;
    if (!currentGroup) {
      toast({ title: 'Error', description: 'No group selected', variant: 'destructive' });
      return;
    }

    const p1Score = parseInt(scorePlayer1) || 0;
    const p2Score = parseInt(scorePlayer2) || 0;

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

      const match: MMRMatch = {
        id: `mmr-${Date.now()}`,
        matchType: '1v1',
        player1,
        player2,
        winner,
        score: { player1Score: p1Score, player2Score: p2Score },
        mmrChange: { player1Change: change1, player2Change: change2, player1NewMmr: newMmr1, player2NewMmr: newMmr2 },
        completedAt: new Date(),
        groupId: currentGroup.id
      };

      const updatedPlayers = players.map(player => {
        if (player.id === player1.id) return { ...player, mmr: newMmr1, peakMmr: Math.max(player.peakMmr, newMmr1), wins: result1 === 1 ? player.wins + 1 : player.wins, losses: result1 === 0 ? player.losses + 1 : player.losses };
        if (player.id === player2.id) return { ...player, mmr: newMmr2, peakMmr: Math.max(player.peakMmr, newMmr2), wins: result2 === 1 ? player.wins + 1 : player.wins, losses: result2 === 0 ? player.losses + 1 : player.losses };
        return player;
      });

      await updateGroup(currentGroup.id, { players: updatedPlayers, mmrMatches: [...(currentGroup.mmrMatches || []), match] });
      onUpdatePlayers(updatedPlayers);
      onAddMatch(match);

      if (checkForSkunkedScore(scorePlayer1, scorePlayer2)) {
        setShowSkunkedAnimation(true);
        setTimeout(() => { setShowSkunkedAnimation(false); resetForm(); setMatchRecordModalOpen(false); }, 3000);
      } else {
        resetForm();
        setMatchRecordModalOpen(false);
      }
      toast({ title: 'Success', description: 'Match recorded successfully!' });
    } catch (error) {
      console.error('Error recording match:', error);
      toast({ title: 'Error', description: 'Failed to record match', variant: 'destructive' });
    } finally {
      setRecording(false);
    }
  };

  const recordMatch2v2 = async () => {
    const teamIds = [selectedPlayer1, selectedTeam1P2, selectedPlayer2, selectedTeam2P2];
    if (teamIds.some(id => !id)) return;
    if (new Set(teamIds).size !== 4) return;
    if (!currentGroup) {
      toast({ title: 'Error', description: 'No group selected', variant: 'destructive' });
      return;
    }

    const t1Score = parseInt(scorePlayer1) || 0;
    const t2Score = parseInt(scorePlayer2) || 0;

    const p1a = players.find(p => p.id === selectedPlayer1)!;
    const p1b = players.find(p => p.id === selectedTeam1P2)!;
    const p2a = players.find(p => p.id === selectedPlayer2)!;
    const p2b = players.find(p => p.id === selectedTeam2P2)!;

    if (!p1a || !p1b || !p2a || !p2b) return;

    setRecording(true);
    try {
      const winnerTeam: 1 | 2 = t1Score > t2Score ? 1 : 2;
      const team1Win = winnerTeam === 1 ? 1 : 0;
      const team2Win = 1 - team1Win;

      const team2Avg = (p2a.mmr + p2b.mmr) / 2;
      const team1Avg = (p1a.mmr + p1b.mmr) / 2;

      const change1a = calculateEloChange(p1a.mmr, team2Avg, team1Win);
      const change1b = calculateEloChange(p1b.mmr, team2Avg, team1Win);
      const change2a = calculateEloChange(p2a.mmr, team1Avg, team2Win);
      const change2b = calculateEloChange(p2b.mmr, team1Avg, team2Win);

      const newMmr1a = Math.max(0, p1a.mmr + change1a);
      const newMmr1b = Math.max(0, p1b.mmr + change1b);
      const newMmr2a = Math.max(0, p2a.mmr + change2a);
      const newMmr2b = Math.max(0, p2b.mmr + change2b);

      const match: MMRMatch = {
        id: `mmr-${Date.now()}`,
        matchType: '2v2',
        player1: p1a,
        player2: p2a,
        winner: winnerTeam === 1 ? p1a : p2a,
        score: { player1Score: t1Score, player2Score: t2Score },
        mmrChange: { player1Change: change1a, player2Change: change2a, player1NewMmr: newMmr1a, player2NewMmr: newMmr2a },
        team1Players: [p1a, p1b],
        team2Players: [p2a, p2b],
        winnerTeam,
        team1MmrChange: { changes: [change1a, change1b], newMmrs: [newMmr1a, newMmr1b] },
        team2MmrChange: { changes: [change2a, change2b], newMmrs: [newMmr2a, newMmr2b] },
        completedAt: new Date(),
        groupId: currentGroup.id
      };

      const updatedPlayers = players.map(player => {
        if (player.id === p1a.id) return { ...player, mmr: newMmr1a, peakMmr: Math.max(player.peakMmr, newMmr1a), wins: team1Win ? player.wins + 1 : player.wins, losses: team1Win ? player.losses : player.losses + 1 };
        if (player.id === p1b.id) return { ...player, mmr: newMmr1b, peakMmr: Math.max(player.peakMmr, newMmr1b), wins: team1Win ? player.wins + 1 : player.wins, losses: team1Win ? player.losses : player.losses + 1 };
        if (player.id === p2a.id) return { ...player, mmr: newMmr2a, peakMmr: Math.max(player.peakMmr, newMmr2a), wins: team2Win ? player.wins + 1 : player.wins, losses: team2Win ? player.losses : player.losses + 1 };
        if (player.id === p2b.id) return { ...player, mmr: newMmr2b, peakMmr: Math.max(player.peakMmr, newMmr2b), wins: team2Win ? player.wins + 1 : player.wins, losses: team2Win ? player.losses : player.losses + 1 };
        return player;
      });

      await updateGroup(currentGroup.id, { players: updatedPlayers, mmrMatches: [...(currentGroup.mmrMatches || []), match] });
      onUpdatePlayers(updatedPlayers);
      onAddMatch(match);
      resetForm();
      setMatchRecordModalOpen(false);
      toast({ title: 'Success', description: '2v2 match recorded!' });
    } catch (error) {
      console.error('Error recording 2v2 match:', error);
      toast({ title: 'Error', description: 'Failed to record match', variant: 'destructive' });
    } finally {
      setRecording(false);
    }
  };

  const canRecord1v1 = !!selectedPlayer1 && !!selectedPlayer2 && selectedPlayer1 !== selectedPlayer2;
  const canRecord2v2 = (() => {
    const ids = [selectedPlayer1, selectedTeam1P2, selectedPlayer2, selectedTeam2P2];
    return ids.every(Boolean) && new Set(ids).size === 4;
  })();

  const defaultTrigger = (
    <Button className="w-full">
      <Target className="w-4 h-4 mr-2" />
      Record Match
    </Button>
  );

  useEffect(() => {
    if (matchRecordModalOpen && user) {
      const currentUserPlayer = players.find(p => p.id === user.uid);
      if (currentUserPlayer && selectedPlayer1 === "") {
        setSelectedPlayer1(currentUserPlayer.id);
      }
    }
  }, [matchRecordModalOpen, user, players, selectedPlayer1]);

  if (players.length < 2) return null;

  const selectedIds2v2 = [selectedPlayer1, selectedTeam1P2, selectedPlayer2, selectedTeam2P2].filter(Boolean);

  const PlayerSelect = ({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude: string[] }) => {
    const available = players.filter(p => !exclude.includes(p.id) || p.id === value);
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select player" />
        </SelectTrigger>
        <SelectContent>
          {available.map(player => {
            const rank = getRankByMmr(player.mmr);
            return (
              <SelectItem key={player.id} value={player.id}>
                <div className="flex items-center gap-2">
                  <span>{rank.icon}</span>
                  <span>{player.name}</span>
                  <span className="text-muted-foreground">({player.mmr})</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Dialog open={matchRecordModalOpen} onOpenChange={setMatchRecordModalOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-ping-pong" />
            Record New Match
          </DialogTitle>
        </DialogHeader>

        {/* Match type toggle */}
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant={matchType === '1v1' ? 'default' : 'outline'}
            onClick={() => { setMatchType('1v1'); resetForm(); }}
            className="gap-1.5"
          >
            <Target className="w-3.5 h-3.5" />
            1v1
          </Button>
          <Button
            size="sm"
            variant={matchType === '2v2' ? 'default' : 'outline'}
            onClick={() => { setMatchType('2v2'); resetForm(); }}
            className="gap-1.5"
            disabled={players.length < 4}
          >
            <Users className="w-3.5 h-3.5" />
            2v2
            {players.length < 4 && <span className="text-xs opacity-60">(need 4+)</span>}
          </Button>
        </div>

        {matchType === '1v1' && (
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <PlayerSelectionField
              label="Player 1"
              playerValue={selectedPlayer1}
              scoreValue={scorePlayer1}
              onPlayerChange={setSelectedPlayer1}
              onScoreChange={setScorePlayer1}
              players={players}
            />
            <PlayerSelectionField
              label="Player 2"
              playerValue={selectedPlayer2}
              scoreValue={scorePlayer2}
              onPlayerChange={setSelectedPlayer2}
              onScoreChange={setScorePlayer2}
              players={players}
              excludePlayerId={selectedPlayer1}
            />
          </div>
        )}

        {matchType === '2v2' && (
          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* Team 1 */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-center py-1 px-3 rounded-md bg-ping-pong/10 text-ping-pong">Team 1</div>
              <PlayerSelect
                value={selectedPlayer1}
                onChange={setSelectedPlayer1}
                exclude={selectedIds2v2.filter(id => id !== selectedPlayer1)}
              />
              <PlayerSelect
                value={selectedTeam1P2}
                onChange={setSelectedTeam1P2}
                exclude={selectedIds2v2.filter(id => id !== selectedTeam1P2)}
              />
              <div>
                <label className="text-sm font-medium mb-1 block">Score</label>
                <Input type="number" placeholder="0" value={scorePlayer1} onChange={e => setScorePlayer1(e.target.value)} className="text-center text-lg font-semibold" />
              </div>
            </div>

            {/* Team 2 */}
            <div className="space-y-3">
              <div className="text-sm font-semibold text-center py-1 px-3 rounded-md bg-table-green/10 text-table-green">Team 2</div>
              <PlayerSelect
                value={selectedPlayer2}
                onChange={setSelectedPlayer2}
                exclude={selectedIds2v2.filter(id => id !== selectedPlayer2)}
              />
              <PlayerSelect
                value={selectedTeam2P2}
                onChange={setSelectedTeam2P2}
                exclude={selectedIds2v2.filter(id => id !== selectedTeam2P2)}
              />
              <div>
                <label className="text-sm font-medium mb-1 block">Score</label>
                <Input type="number" placeholder="0" value={scorePlayer2} onChange={e => setScorePlayer2(e.target.value)} className="text-center text-lg font-semibold" />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => { resetForm(); setMatchRecordModalOpen(false); }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={matchType === '1v1' ? recordMatch1v1 : recordMatch2v2}
            disabled={recording || (matchType === '1v1' ? !canRecord1v1 : !canRecord2v2)}
            className="flex-1 bg-gradient-to-r from-table-green to-secondary hover:from-table-green/90 hover:to-secondary/90 text-white font-semibold"
          >
            <Target className="w-4 h-4 mr-2" />
            {recording ? 'Recording...' : 'Record Match'}
          </Button>
        </div>

        <SkunkedAnimation show={showSkunkedAnimation} />
      </DialogContent>
    </Dialog>
  );
};
