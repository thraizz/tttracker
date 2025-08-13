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
import { createGroupInvite } from '@/services/groupService';
import { Plus, Users, Share, Copy } from 'lucide-react';

export const GroupManager: React.FC = () => {
  const { user } = useAuth();
  const { currentGroup, userGroups, createNewGroup, setCurrentGroup } = useGroup();
  const { toast } = useToast();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({ title: 'Error', description: 'Group name is required', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      await createNewGroup(newGroupName.trim(), newGroupDescription.trim());
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
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

  return (
    <div className="space-y-4">
      {/* Current Group Display */}
      {currentGroup && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{currentGroup.name}</CardTitle>
                {currentGroup.description && (
                  <CardDescription>{currentGroup.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {currentGroup.members.length}
                </Badge>
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
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Group Selection and Creation */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={currentGroup?.id || ''}
            onValueChange={(groupId) => {
              const group = userGroups.find(g => g.id === groupId);
              setCurrentGroup(group || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
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
    </div>
  );
};