import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Cloud, Shield, Smartphone, ArrowRight, AlertTriangle } from 'lucide-react';

interface GoogleUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GoogleUpgradeModal: React.FC<GoogleUpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { upgradeToGoogle, isAnonymous } = useAuth();
  const { toast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showMergeOptions, setShowMergeOptions] = useState(false);
  const [existingUserInfo, setExistingUserInfo] = useState<{ email?: string } | null>(null);

  const handleUpgrade = async () => {
    if (!isAnonymous) {
      toast({
        title: 'Error',
        description: 'You are already signed in with Google.',
        variant: 'destructive'
      });
      return;
    }

    setIsUpgrading(true);
    try {
      const result = await upgradeToGoogle();
      
      if (result.success) {
        toast({
          title: 'Success!',
          description: 'Your account has been upgraded to Google. Your data is now synced across devices.'
        });
        onSuccess?.();
        onClose();
      } else if (result.requiresMerge) {
        setExistingUserInfo(result.existingUser);
        setShowMergeOptions(true);
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Upgrade Failed',
        description: 'Failed to upgrade to Google account. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleKeepAnonymous = () => {
    toast({
      title: 'No Problem!',
      description: 'You can continue using the app anonymously. You can upgrade anytime from Settings.'
    });
    onClose();
  };

  const handleExistingAccountChoice = async (choice: 'merge' | 'separate') => {
    if (choice === 'merge') {
      // For now, we'll keep it simple and just switch to the existing account
      toast({
        title: 'Switching to Existing Account',
        description: 'You are now signed in with your existing Google account.'
      });
      onSuccess?.();
      onClose();
    } else {
      // Keep using anonymous account
      handleKeepAnonymous();
    }
  };

  const benefits = [
    {
      icon: Cloud,
      title: 'Cross-Device Sync',
      description: 'Access your tournaments and stats from any device'
    },
    {
      icon: Shield,
      title: 'Data Backup',
      description: 'Never lose your match history and player statistics'
    },
    {
      icon: Smartphone,
      title: 'Better Experience',
      description: 'Pre-filled names and personalized features'
    }
  ];

  if (showMergeOptions) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Account Already Exists
            </DialogTitle>
            <DialogDescription>
              A Google account with this email already exists. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                {existingUserInfo?.email && `Account: ${existingUserInfo.email}`}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                onClick={() => handleExistingAccountChoice('merge')}
                className="w-full justify-start"
                variant="outline"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Switch to Existing Google Account
              </Button>
              
              <Button
                onClick={() => handleExistingAccountChoice('separate')}
                className="w-full justify-start"
                variant="outline"
              >
                Continue as Anonymous User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center">Upgrade to Google Account</DialogTitle>
          <DialogDescription className="text-center">
            Get the most out of TTTracker with cross-device sync and data backup
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <benefit.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{benefit.title}</h4>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Privacy First:</strong> We only store your table tennis data and Google profile info. 
              You can delete your account anytime or continue using anonymously.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="w-full"
            >
              {isUpgrading ? 'Upgrading...' : 'Upgrade with Google'}
            </Button>
            
            <Button
              onClick={handleKeepAnonymous}
              variant="outline"
              className="w-full"
              disabled={isUpgrading}
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your current data will be automatically migrated to your Google account
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};