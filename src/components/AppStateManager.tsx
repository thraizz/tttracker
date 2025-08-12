import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trophy, Target } from "lucide-react";
import { RoomManager } from "@/components/RoomManager";
import { Player, Tournament } from "@/types/tournament";

type AppState = 'no-room' | 'empty-room' | 'setup' | 'tournament-ready' | 'tournament-active' | 'mmr-active';

interface AppStateManagerProps {
  currentRoom: any;
  players: Player[];
  currentTournament: Tournament | null;
  activeTab: 'tournament' | 'mmr';
  children: React.ReactNode;
}

export const AppStateManager = ({
  currentRoom,
  players,
  currentTournament,
  activeTab,
  children
}: AppStateManagerProps) => {
  const getAppState = (): AppState => {
    if (!currentRoom) return 'no-room';
    if (players.length === 0) return 'empty-room';
    if (currentTournament?.status === 'active') return 'tournament-active';
    if (activeTab === 'tournament' && players.length >= 2) return 'tournament-ready';
    if (activeTab === 'mmr' && players.length >= 2) return 'mmr-active';
    return 'setup';
  };

  const currentState = getAppState();

  // Handle no room state
  if (currentState === 'no-room') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-gray to-background flex items-center justify-center">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-ping-pong to-victory-gold flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-ping-pong to-victory-gold bg-clip-text text-transparent">
                TTTracker
              </h1>
            </div>
            <p className="text-muted-foreground text-lg mb-8">
              Tournament brackets and MMR tracking for your table tennis group
            </p>
          </div>
          
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-center">Select or Create a Room</h2>
            <RoomManager />
          </Card>
        </div>
      </div>
    );
  }

  // Handle empty room state
  if (currentState === 'empty-room') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
          <h3 className="text-xl font-semibold mb-4">Welcome to {currentRoom.name}!</h3>
          <p className="text-muted-foreground mb-6">
            Get started by adding players to your room. You can then create tournaments or track MMR matches.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add players using the sidebar to begin
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // For all other states, render the normal layout with children
  return <>{children}</>;
};

export default AppStateManager;