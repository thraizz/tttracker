import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useGroup } from '@/contexts/GroupContext';
import { updateGroup } from '@/services/groupService';
import { Player, Tournament, MMRMatch } from '@/types/tournament';
import { Upload, Users, Trophy, Target, AlertCircle } from 'lucide-react';

interface LegacyData {
  players?: Player[];
  currentTournament?: Tournament;
  mmrMatches?: MMRMatch[];
  view?: 'setup' | 'tournament';
  activeTab?: 'tournament' | 'mmr';
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  legacyData: LegacyData;
  onMigrationComplete: () => void;
  onDismiss: () => void;
}

export const LegacyDataMigrationDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  legacyData,
  onMigrationComplete,
  onDismiss
}) => {
  const { createNewGroup } = useGroup();
  const { toast } = useToast();
  const [groupName, setGroupName] = useState('My Table Tennis Group');
  const [migrating, setMigrating] = useState(false);

  const playerCount = legacyData.players?.length || 0;
  const tournamentCount = legacyData.currentTournament ? 1 : 0;
  const matchCount = legacyData.mmrMatches?.length || 0;

  const handleMigration = async () => {
    if (!groupName.trim()) {
      toast({ title: 'Error', description: 'Please enter a group name', variant: 'destructive' });
      return;
    }

    setMigrating(true);
    try {
      // Ensure players have MMR fields
      const players = (legacyData.players || []).map((player: Player) => ({
        ...player,
        mmr: player.mmr || 1000,
        peakMmr: player.peakMmr || player.mmr || 1000
      }));

      const tournaments = legacyData.currentTournament ? [legacyData.currentTournament] : [];
      const mmrMatches = legacyData.mmrMatches || [];

      // Create new group
      const groupId = await createNewGroup(groupName.trim(), 'Migrated from local storage');
      
      // Update group with legacy data
      await updateGroup(groupId, {
        players,
        tournaments,
        mmrMatches
      });

      toast({ 
        title: 'Migration Successful!', 
        description: `Your data has been migrated to group "${groupName}"`
      });

      onMigrationComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error during migration:', error);
      toast({ 
        title: 'Migration Failed', 
        description: 'Failed to migrate your data. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Migrate Your Data
          </DialogTitle>
          <DialogDescription>
            We found data from a previous version of TTTracker. Would you like to migrate it to the new group-based system?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Data Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-3">Found data:</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{playerCount}</span>
                  <span className="text-xs text-muted-foreground">Players</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{tournamentCount}</span>
                  <span className="text-xs text-muted-foreground">Tournaments</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{matchCount}</span>
                  <span className="text-xs text-muted-foreground">MMR Matches</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Name Input */}
          <div className="space-y-2">
            <Label htmlFor="group-name">New Group Name</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter a name for your group"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">What happens next:</p>
              <p className="text-amber-700">
                Your data will be moved to a new group. You can then share this group with others or keep it private.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              onDismiss();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleMigration}
            disabled={migrating || !groupName.trim()}
            className="w-full sm:w-auto"
          >
            {migrating ? 'Migrating...' : 'Migrate Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};