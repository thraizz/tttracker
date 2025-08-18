import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Settings,
  Share,
  Copy,
  QrCode,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getOrCreateGroupInvite, updateGroup } from "@/services/groupService";
import { Group } from "@/types/tournament";
import QRCode from "qrcode";

interface GroupCardProps {
  group: Group;
  isActive: boolean;
  onSelect: (group: Group) => void;
  showManagementButtons?: boolean;
}

export const GroupCard = ({ group, isActive, onSelect, showManagementButtons = true }: GroupCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editAllowPublicJoin, setEditAllowPublicJoin] = useState(false);
  const [editRequireApproval, setEditRequireApproval] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  const handleEditGroup = () => {
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || "");
    setEditAllowPublicJoin(group.settings.allowPublicJoin);
    setEditRequireApproval(group.settings.requireApproval);
    setEditDialogOpen(true);
  };

  const handleSaveGroupEdit = async () => {
    if (!editGroupName.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    setEditing(true);
    try {
      await updateGroup(group.id, {
        name: editGroupName.trim(),
        description: editGroupDescription.trim(),
        settings: {
          ...group.settings,
          allowPublicJoin: editAllowPublicJoin,
          requireApproval: editRequireApproval,
        },
      });
      setEditDialogOpen(false);
      toast({ title: "Success", description: "Group updated successfully!" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    } finally {
      setEditing(false);
    }
  };

  const handleShareGroup = async () => {
    if (!user) return;

    try {
      const inviteId = await getOrCreateGroupInvite(group.id, group.name, user.uid);
      const link = `${window.location.origin}/join/${inviteId}`;
      setShareLink(link);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(link, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeUrl(qrDataUrl);

      setShareDialogOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Success",
        description: "Share link copied to clipboard!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card
        className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${isActive
            ? "bg-gradient-to-r from-ping-pong/5 to-table-green/5 border-ping-pong/20"
            : ""
          }`}
        onClick={() => onSelect(group)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{group.name}</h3>
            {group.description && (
              <p className="text-sm text-muted-foreground">
                {group.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {group.players?.length || 0} players
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={group.isPublic ? "secondary" : "outline"}>
              {group.isPublic ? "Public" : "Private"}
            </Badge>
            {isActive && <Badge className="bg-ping-pong">Active</Badge>}
            {showManagementButtons && (
              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditGroup}
                  className="gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
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
        </div>
      </Card>

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
              <Label htmlFor="edit-group-description">
                Description (Optional)
              </Label>
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
                {editing ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
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

            {qrCodeUrl && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  <span className="text-sm font-medium">QR Code</span>
                </div>
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code for group invite"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Scan with your phone camera to quickly join the group
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              This link will allow others to join your group. Keep it private!
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
