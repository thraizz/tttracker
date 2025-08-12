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
import { useRoom } from '@/contexts/RoomContext';
import { useAuth } from '@/contexts/AuthContext';
import { createRoomInvite } from '@/services/roomService';
import { Plus, Users, Share, Copy } from 'lucide-react';

export const RoomManager: React.FC = () => {
  const { user } = useAuth();
  const { currentRoom, userRooms, createNewRoom, setCurrentRoom } = useRoom();
  const { toast } = useToast();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) {
      toast({ title: 'Error', description: 'Room name is required', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      await createNewRoom(newRoomName.trim(), newRoomDescription.trim());
      setCreateDialogOpen(false);
      setNewRoomName('');
      setNewRoomDescription('');
      toast({ title: 'Success', description: 'Room created successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create room', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleShareRoom = async () => {
    if (!currentRoom || !user) return;
    
    try {
      const inviteId = await createRoomInvite(currentRoom.id, currentRoom.name, user.uid);
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
      {/* Current Room Display */}
      {currentRoom && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{currentRoom.name}</CardTitle>
                {currentRoom.description && (
                  <CardDescription>{currentRoom.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {currentRoom.members.length}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareRoom}
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

      {/* Room Selection and Creation */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Select
            value={currentRoom?.id || ''}
            onValueChange={(roomId) => {
              const room = userRooms.find(r => r.id === roomId);
              setCurrentRoom(room || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {userRooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{room.name}</span>
                    <Badge variant="outline" className="ml-2 gap-1">
                      <Users className="h-3 w-3" />
                      {room.members.length}
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
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Room</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="room-name">Room Name</Label>
                <Input
                  id="room-name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Enter room name"
                />
              </div>
              <div>
                <Label htmlFor="room-description">Description (Optional)</Label>
                <Textarea
                  id="room-description"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  placeholder="Describe your room"
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
                <Button onClick={handleCreateRoom} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Room'}
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
            <DialogTitle>Share Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with others to invite them to your room:
            </p>
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button onClick={copyShareLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link will allow others to join your room. Keep it private!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};