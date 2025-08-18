import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGroup } from "@/contexts/GroupContext";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { GroupApprovalModal } from "./GroupApprovalModal";
import { JoinGroupModal } from "./JoinGroupModal";
import { Plus, Users } from "lucide-react";
import { Group } from "@/types/tournament";

export const GroupManager: React.FC = () => {
  const { user } = useAuth();
  const {
    currentGroup,
    userGroups,
    publicGroups,
    createNewGroup,
    setCurrentGroup,
    joinGroupById,
  } = useGroup();
  const { toast } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupAllowPublicJoin, setNewGroupAllowPublicJoin] = useState(false);
  const [newGroupRequireApproval, setNewGroupRequireApproval] = useState(false);
  const [creating, setCreating] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedApprovalGroup, setSelectedApprovalGroup] =
    useState<Group | null>(null);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [selectedJoinGroup, setSelectedJoinGroup] = useState<Group | null>(
    null,
  );

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

  const handleJoinGroup = async (playerName: string) => {
    if (!selectedJoinGroup) return;

    try {
      await joinGroupById(selectedJoinGroup.id, playerName);
      toast({
        title: "Success",
        description: `Joined ${selectedJoinGroup.name}!`,
      });
      setJoinModalOpen(false);
      setSelectedJoinGroup(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      });
      throw error; // Re-throw to let the modal handle the error
    }
  };

  return (
    <div className="space-y-4">
      {/* Group Selection and Creation */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={currentGroup?.id || ""}
            onValueChange={async (value) => {
              if (value.startsWith("public-")) {
                const groupId = value.replace("public-", "");
                const group = publicGroups.find((g) => g.id === groupId);
                if (group) {
                  if (group.settings.requireApproval) {
                    setSelectedApprovalGroup(group);
                    setApprovalModalOpen(true);
                    return;
                  }
                  // Show join modal to prompt for player name
                  setSelectedJoinGroup(group);
                  setJoinModalOpen(true);
                }
              } else {
                const group = userGroups.find((g) => g.id === value);
                setCurrentGroup(group || null);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  userGroups.length === 0 && publicGroups.length === 0
                    ? "No groups available"
                    : "Select or switch groups"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {/* User's Groups */}
              {userGroups.length > 0 && (
                <>
                  {userGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{group.name}</span>
                        <Badge variant="outline" className="ml-2 gap-1">
                          <Users className="h-3 w-3" />
                          {group.players.length}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}

              {/* Public Groups Section */}
              {publicGroups.length > 0 && (
                <>
                  {userGroups.length > 0 && (
                    <div className="px-2 py-1 text-xs text-muted-foreground border-t border-border mt-1">
                      Public Groups
                    </div>
                  )}
                  {publicGroups.map((group) => (
                    <SelectItem
                      key={`public-${group.id}`}
                      value={`public-${group.id}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {group.name} {group.settings.requireApproval && "🔒"}
                        </span>
                        <Badge variant="secondary" className="ml-2 gap-1">
                          <Users className="h-3 w-3" />
                          {group.players.length}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}

              {/* No Groups Available */}
              {userGroups.length === 0 && publicGroups.length === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  <div className="space-y-2">
                    <div>No groups available</div>
                    <div className="text-xs">
                      Create a new group or use an invite link to join one
                    </div>
                  </div>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-1">
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
                  onChange={(e) => setNewGroupDescription(e.target.value)}
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

      {/* Group Approval Modal */}
      {selectedApprovalGroup && (
        <GroupApprovalModal
          group={selectedApprovalGroup}
          isOpen={approvalModalOpen}
          onClose={() => {
            setApprovalModalOpen(false);
            setSelectedApprovalGroup(null);
          }}
          onRequestSent={() => {
            // Handle request sent - could track pending requests here
          }}
        />
      )}

      {/* Join Group Modal */}
      {selectedJoinGroup && (
        <JoinGroupModal
          isOpen={joinModalOpen}
          onClose={() => {
            setJoinModalOpen(false);
            setSelectedJoinGroup(null);
          }}
          onJoin={handleJoinGroup}
          groupName={selectedJoinGroup.name}
        />
      )}
    </div>
  );
};
