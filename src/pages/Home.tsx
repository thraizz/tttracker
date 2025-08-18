import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, Settings, Plus, Users } from "lucide-react";
import { GroupCard } from "@/components/GroupCard";
import { UserAvatar } from "@/components/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/contexts/GroupContext";
import { useToast } from "@/hooks/use-toast";
import { useLegacyDataMigration } from "@/hooks/useLegacyDataMigration";
import { LegacyDataMigrationDialog } from "@/components/LegacyDataMigrationDialog";

const Home = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    currentGroup,
    userGroups,
    publicGroups,
    loading: groupLoading,
    refreshGroups,
    refreshPublicGroups,
    createNewGroup,
    setCurrentGroup,
  } = useGroup();
  const { toast } = useToast();
  const {
    hasLegacyData,
    legacyData,
    migrationChecked,
    clearLegacyData,
    markMigrationDismissed,
  } = useLegacyDataMigration();
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupAllowPublicJoin, setNewGroupAllowPublicJoin] = useState(false);
  const [newGroupRequireApproval, setNewGroupRequireApproval] = useState(false);
  const [creating, setCreating] = useState(false);

  // Redirect to MMR page if group is selected
  useEffect(() => {
    if (currentGroup && !groupLoading) {
      navigate("/mmr");
    }
  }, [currentGroup, groupLoading, navigate]);

  // Show migration dialog when legacy data is detected and no current group
  useEffect(() => {
    if (
      migrationChecked &&
      hasLegacyData &&
      !currentGroup &&
      !groupLoading &&
      !authLoading
    ) {
      setMigrationDialogOpen(true);
    }
  }, [
    migrationChecked,
    hasLegacyData,
    currentGroup,
    groupLoading,
    authLoading,
  ]);

  const handleMigrationComplete = async () => {
    clearLegacyData();
    await refreshGroups();
    await refreshPublicGroups();
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      await createNewGroup(newGroupName.trim(), newGroupDescription.trim(), {
        allowPublicJoin: newGroupAllowPublicJoin,
        requireApproval: newGroupRequireApproval,
      });
      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupAllowPublicJoin(false);
      setNewGroupRequireApproval(false);
      toast({ title: "Success", description: "Group created successfully!" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
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
                {user && !user.isAnonymous
                  ? user.displayName || user.email
                  : "Anonymous"}
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

        <div className="space-y-6">
          {/* Your Groups */}
          {userGroups.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Your Groups</h2>
                <Dialog
                  open={createDialogOpen}
                  onOpenChange={setCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-description">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="group-description"
                          value={newGroupDescription}
                          onChange={(e) =>
                            setNewGroupDescription(e.target.value)
                          }
                          placeholder="Describe your group"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Allow Public Join</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow anyone to discover and join this group
                            </p>
                          </div>
                          <Switch
                            checked={newGroupAllowPublicJoin}
                            onCheckedChange={setNewGroupAllowPublicJoin}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Require Approval</Label>
                            <p className="text-sm text-muted-foreground">
                              New members must be approved before joining
                            </p>
                          </div>
                          <Switch
                            checked={newGroupRequireApproval}
                            onCheckedChange={setNewGroupRequireApproval}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCreateDialogOpen(false)}
                          disabled={creating}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateGroup} disabled={creating}>
                          {creating ? "Creating..." : "Create Group"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isActive={currentGroup?.id === group.id}
                    onSelect={setCurrentGroup}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Public Groups */}
          {publicGroups.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-6 w-6 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Public Groups</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {publicGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isActive={currentGroup?.id === group.id}
                    onSelect={setCurrentGroup}
                    showManagementButtons={false}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Create First Group */}
          {userGroups.length === 0 && (
            <Card className="p-8">
              <div className="text-center">
                <Plus className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-semibold mb-2">
                  Create Your First Group
                </h2>
                <p className="text-muted-foreground mb-6">
                  Get started by creating a group for your table tennis
                  tournaments and MMR tracking.
                </p>
                <Dialog
                  open={createDialogOpen}
                  onOpenChange={setCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          placeholder="Enter group name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-description">
                          Description (Optional)
                        </Label>
                        <Textarea
                          id="group-description"
                          value={newGroupDescription}
                          onChange={(e) =>
                            setNewGroupDescription(e.target.value)
                          }
                          placeholder="Describe your group"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Allow Public Join</Label>
                            <p className="text-sm text-muted-foreground">
                              Allow anyone to discover and join this group
                            </p>
                          </div>
                          <Switch
                            checked={newGroupAllowPublicJoin}
                            onCheckedChange={setNewGroupAllowPublicJoin}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Require Approval</Label>
                            <p className="text-sm text-muted-foreground">
                              New members must be approved before joining
                            </p>
                          </div>
                          <Switch
                            checked={newGroupRequireApproval}
                            onCheckedChange={setNewGroupRequireApproval}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setCreateDialogOpen(false)}
                          disabled={creating}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleCreateGroup} disabled={creating}>
                          {creating ? "Creating..." : "Create Group"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          )}
        </div>

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
