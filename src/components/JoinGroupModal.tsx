import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, LogIn, Sparkles, Cloud } from 'lucide-react';
import { userProfileService, NameSuggestion } from '@/services/userProfileService';
import { GoogleUpgradeModal } from './GoogleUpgradeModal';

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
  const [nameSuggestions, setNameSuggestions] = useState<NameSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Load name suggestions when modal opens
  useEffect(() => {
    const loadNameSuggestions = async () => {
      if (isOpen && user) {
        const suggestions = await userProfileService.getNameSuggestions();
        setNameSuggestions(suggestions);
        
        // Auto-fill with first suggestion if available and name is empty
        if (suggestions.length > 0 && !playerName) {
          setPlayerName(suggestions[0].name);
        }
      }
    };

    loadNameSuggestions();
  }, [isOpen, user, playerName]);

  const handleGoogleSignIn = async () => {
    if (isAnonymous) {
      // Show upgrade modal for anonymous users
      setShowUpgradeModal(true);
    } else {
      // Direct Google sign-in for new users
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
    }
  };

  const handleUpgradeSuccess = () => {
    setShowUpgradeModal(false);
    // Reload suggestions since user is now authenticated
    const loadNameSuggestions = async () => {
      if (user) {
        const suggestions = await userProfileService.getNameSuggestions();
        setNameSuggestions(suggestions);
        
        if (suggestions.length > 0 && !playerName) {
          setPlayerName(suggestions[0].name);
        }
      }
    };
    loadNameSuggestions();
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

  const handleSuggestionSelect = (suggestion: NameSuggestion) => {
    setPlayerName(suggestion.name);
    setShowSuggestions(false);
  };

  const getSuggestionLabel = (suggestion: NameSuggestion) => {
    switch (suggestion.source) {
      case 'google':
        return 'Google Account';
      case 'saved':
        return 'Previously Used';
      case 'previous':
        return suggestion.groupName ? `From ${suggestion.groupName}` : 'Previous Group';
      default:
        return '';
    }
  };

  const handleClose = () => {
    setPlayerName('');
    setShowSuggestions(false);
    setShowUpgradeModal(false);
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
            <div className="flex items-center justify-between">
              <Label htmlFor="playerName">Your Name</Label>
              {nameSuggestions.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="h-auto p-1 text-xs"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Suggestions
                </Button>
              )}
            </div>
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
            
            {/* Name Suggestions */}
            {showSuggestions && nameSuggestions.length > 0 && (
              <div className="border rounded-md p-2 bg-muted/50 space-y-1">
                <div className="text-xs text-muted-foreground mb-2">Quick suggestions:</div>
                {nameSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full text-left p-2 text-sm rounded hover:bg-muted transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">{suggestion.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {getSuggestionLabel(suggestion)}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
                {isAnonymous ? (
                  <>
                    <Cloud className="mr-2 h-4 w-4" />
                    Change to Google Account
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                  </>
                )}
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

      {/* Google Upgrade Modal */}
      <GoogleUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSuccess={handleUpgradeSuccess}
      />
    </Dialog>
  );
};