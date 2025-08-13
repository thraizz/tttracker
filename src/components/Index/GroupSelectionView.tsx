import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Trophy, Settings } from "lucide-react";
import { GroupManager } from "@/components/GroupManager";
import { UserAvatar } from "@/components/UserAvatar";
import { User } from "firebase/auth";

interface GroupSelectionViewProps {
  user: User | null;
}

export const GroupSelectionView = ({ user }: GroupSelectionViewProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-gray to-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="text-center mb-8 relative">
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

          {/* User Avatar and Settings */}
          <div className="absolute top-0 right-0 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <UserAvatar size="sm" />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user && !user.isAnonymous ? user.displayName || user.email : 'Anonymous'}
              </span>
            </div>
            <Link to="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </Link>
          </div>
        </div>
        
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6 text-center">Select or Create a Group</h2>
          <GroupManager />
        </Card>
      </div>
    </div>
  );
};