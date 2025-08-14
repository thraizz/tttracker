import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, LogIn } from 'lucide-react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (playerName: string) => Promise<void>;
  groupName: string;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onJoin,
  groupName
}) => {
  const { user, signInWithGoogle, isAnonymous } = useAuth();
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Pre-fill name if user is authenticated and has a display name
  React.useEffect(() => {
    if (user && !isAnonymous && user.displayName) {
      setPlayerName(user.displayName);
    }
  }, [user, isAnonymous]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      toast({
        title: 'Success',
        description: 'Signed in with Google successfully!'
      });
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!playerName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your name to join the group.',
        variant: 'destructive'
      });
      return;
    }

    setIsJoining(true);
    try {
      await onJoin(playerName.trim());
      onClose();
    } catch (error) {
      console.error('Join group error:', error);
      toast({
        title: 'Error',
        description: 'Failed to join group. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleClose = () => {
    // Only clear if user was anonymous, keep prefilled name for authenticated users
    if (isAnonymous) {
      setPlayerName('');
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Join {groupName}
          </DialogTitle>
          <DialogDescription>
            Enter your name to join this table tennis group. You can also sign in with Google for a better experience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Authentication Status */}
          {user && !isAnonymous && (
            <div className="text-sm text-muted-foreground bg-green-50 p-3 rounded-md border border-green-200">
              ✓ Signed in as {user.displayName || user.email}
            </div>
          )}
          
          {/* Player Name Input */}
          <div className="space-y-2">
            <Label htmlFor="playerName">Your Name</Label>
            <Input
              id="playerName"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={isJoining}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && playerName.trim()) {
                  handleJoinGroup();
                }
              }}
            />
          </div>

          {/* Google Sign In Button (only show if anonymous) */}
          {(!user || isAnonymous) && (
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isJoining}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinGroup}
              disabled={isJoining || !playerName.trim()}
              className="flex-1"
            >
              {isJoining ? 'Joining...' : 'Join Group'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};