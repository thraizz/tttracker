import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Group } from '@/types/tournament';
import { Lock, Users, Calendar } from 'lucide-react';

interface GroupApprovalModalProps {
  group: Group;
  isOpen: boolean;
  onClose: () => void;
  onRequestSent: () => void;
}

export const GroupApprovalModal: React.FC<GroupApprovalModalProps> = ({
  group,
  isOpen,
  onClose,
  onRequestSent
}) => {
  const [playerName, setPlayerName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSendRequest = async () => {
    if (!playerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name to send the join request.',
        variant: 'destructive'
      });
      return;
    }

    setSending(true);
    
    // Simulate sending approval request
    // In a real implementation, this would send a request to the group owner
    setTimeout(() => {
      setSending(false);
      onRequestSent();
      toast({ 
        title: 'Request Sent', 
        description: `Your request to join "${group.name}" has been sent to the group owner.`
      });
      onClose();
      setPlayerName('');
      setMessage('');
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            Approval Required
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{group.name}</h3>
            {group.description && (
              <p className="text-muted-foreground text-sm">{group.description}</p>
            )}
          </div>

          <div className="space-y-3 border rounded-lg p-3 bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{group.members.length} members</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Created {group.createdAt.toLocaleDateString()}</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This group requires approval from the group owner before you can join. 
              Please enter your name and you can include a message with your request:
            </p>
            
            <div>
              <Label htmlFor="player-name">Your Name</Label>
              <Input
                id="player-name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                disabled={sending}
              />
            </div>
            
            <div>
              <Label htmlFor="approval-message">Message (Optional)</Label>
              <Textarea
                id="approval-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! I'd like to join your table tennis group..."
                rows={3}
                maxLength={500}
                disabled={sending}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/500 characters
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={sending || !playerName.trim()}
              className="flex-1"
            >
              {sending ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};