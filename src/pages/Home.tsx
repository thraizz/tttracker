import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Settings } from "lucide-react";
import { GroupManager } from "@/components/GroupManager";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { useLegacyDataMigration } from "@/hooks/useLegacyDataMigration";
import { LegacyDataMigrationDialog } from "@/components/LegacyDataMigrationDialog";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { currentGroup, loading: groupLoading, refreshGroups } = useGroup();
  const { hasLegacyData, legacyData, migrationChecked, clearLegacyData, markMigrationDismissed } = useLegacyDataMigration();
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);

  // Redirect to MMR page if group is selected
  useEffect(() => {
    if (currentGroup && !groupLoading) {
      navigate('/mmr');
    }
  }, [currentGroup, groupLoading, navigate]);

  // Show migration dialog when legacy data is detected and no current group
  useEffect(() => {
    if (migrationChecked && hasLegacyData && !currentGroup && !groupLoading && !authLoading) {
      setMigrationDialogOpen(true);
    }
  }, [migrationChecked, hasLegacyData, currentGroup, groupLoading, authLoading]);

  const handleMigrationComplete = async () => {
    clearLegacyData();
    await refreshGroups();
  };

  // Show loading while authenticating or loading group
  if (authLoading || groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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

        {/* Legacy Data Migration Dialog */}
        <LegacyDataMigrationDialog
          open={migrationDialogOpen}
          onOpenChange={setMigrationDialogOpen}
          legacyData={legacyData || {}}
          onMigrationComplete={handleMigrationComplete}
          onDismiss={markMigrationDismissed}
        />
      </div>
    </div>
  );
};

export default Home;