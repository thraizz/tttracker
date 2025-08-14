import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGroup } from '@/contexts/GroupContext';
import { useAuth } from '@/contexts/AuthContext';
import { createGroupInvite, updateGroup } from '@/services/groupService';
import { Switch } from '@/components/ui/switch';
import { GroupApprovalModal } from './GroupApprovalModal';
import { Plus, Users, Share, Copy, Settings, Clock } from 'lucide-react';
import { Group } from '@/types/tournament';

export const GroupManager: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, userGroups, publicGroups, createNewGroup, setCurrentGroup, joinGroupById } = useGroup();
  const { toast } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupAllowPublicJoin, setNewGroupAllowPublicJoin] = useState(false);
  const [newGroupRequireApproval, setNewGroupRequireApproval] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDescription, setEditGroupDescription] = useState('');
  const [editAllowPublicJoin, setEditAllowPublicJoin] = useState(false);
  const [editRequireApproval, setEditRequireApproval] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedApprovalGroup, setSelectedApprovalGroup] = useState<Group | null>(null);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      await createNewGroup(
        newGroupName.trim(),
        newGroupDescription.trim(),
        {
          allowPublicJoin: newGroupAllowPublicJoin,
          requireApproval: newGroupRequireApproval
        }
      );
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setNewGroupAllowPublicJoin(false);
      setNewGroupRequireApproval(false);
      toast({ title: 'Success', description: 'Group created successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create group', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleShareGroup = async () => {
    if (!currentGroup || !user) return;

    try {
      const inviteId = await createGroupInvite(currentGroup.id, currentGroup.name, user.uid);
      const link = `${window.location.origin}/join/${inviteId}`;
      setShareLink(link);
      setShareDialogOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create share link', variant: 'destructive' });
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({ title: 'Success', description: 'Share link copied to clipboard!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const handleEditGroup = () => {
    if (!currentGroup) return;
    setEditGroupName(currentGroup.name);
    setEditGroupDescription(currentGroup.description || '');
    setEditAllowPublicJoin(currentGroup.settings.allowPublicJoin);
    setEditRequireApproval(currentGroup.settings.requireApproval);
    setEditDialogOpen(true);
  };

  const handleSaveGroupEdit = async () => {
    if (!currentGroup || !editGroupName.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }

    setEditing(true);
    try {
      await updateGroup(currentGroup.id, {
        name: editGroupName.trim(),
        description: editGroupDescription.trim(),
        settings: {
          ...currentGroup.settings,
          allowPublicJoin: editAllowPublicJoin,
          requireApproval: editRequireApproval
        }
      });
      setEditDialogOpen(false);
      toast({ title: 'Success', description: 'Group updated successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update group', variant: 'destructive' });
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Your Groups */}
      {userGroups.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Your Groups
                </CardTitle>
                <CardDescription>
                  Quick access to groups you're a member of
                </CardDescription>
              </div>
              {currentGroup && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditGroup}
                    className="gap-1"
                  >
                    <Settings className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareGroup}
                    className="gap-1"
                  >
                    <Share className="h-3 w-3" />
                    Share
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {userGroups.map((group) => (
                <Button
                  key={group.id}
                  variant={currentGroup?.id === group.id ? "default" : "outline"}
                  onClick={() => setCurrentGroup(group)}
                  className="justify-between h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{group.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group.members.length} members
                      {group.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px]">{group.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {currentGroup?.id === group.id && (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Selection and Creation */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={currentGroup?.id || ''}
            onValueChange={async (value) => {
              if (value.startsWith('public-')) {
                const groupId = value.replace('public-', '');
                const group = publicGroups.find(g => g.id === groupId);
                if (group) {
                  if (group.settings.requireApproval) {
                    setSelectedApprovalGroup(group);
                    setApprovalModalOpen(true);
                    return;
                  }
                  try {
                    await joinGroupById(groupId);
                    toast({ title: 'Success', description: `Joined ${group.name}!` });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to join group', variant: 'destructive' });
                  }
                }
              } else {
                const group = userGroups.find(g => g.id === value);
                setCurrentGroup(group || null);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={
                userGroups.length === 0 && publicGroups.length === 0
                  ? "No groups available"
                  : "Select or switch groups"
              } />
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
                          {group.members.length}
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
                    <SelectItem key={`public-${group.id}`} value={`public-${group.id}`}>
                      <div className="flex items-center justify-between w-full">
                        <span>{group.name} {group.settings.requireApproval && '🔒'}</span>
                        <Badge variant="secondary" className="ml-2 gap-1">
                          <Users className="h-3 w-3" />
                          {group.members.length}
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
                <Label htmlFor="group-description">Description (Optional)</Label>
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
                  {creating ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-group-name">Group Name</Label>
              <Input
                id="edit-group-name"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <div>
              <Label htmlFor="edit-group-description">Description (Optional)</Label>
              <Textarea
                id="edit-group-description"
                value={editGroupDescription}
                onChange={(e) => setEditGroupDescription(e.target.value)}
                placeholder="Describe your group"
                rows={3}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Public Join</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anyone to join this group without an invitation
                  </p>
                </div>
                <Switch
                  checked={editAllowPublicJoin}
                  onCheckedChange={setEditAllowPublicJoin}
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
                  checked={editRequireApproval}
                  onCheckedChange={setEditRequireApproval}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={editing}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveGroupEdit} disabled={editing}>
                {editing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with others to invite them to your group:
            </p>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button onClick={copyShareLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link will allow others to join your group. Keep it private!
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};