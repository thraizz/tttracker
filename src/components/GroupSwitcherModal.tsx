import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, ChevronRight, Plus } from "lucide-react";
import { GroupManager } from "@/components/GroupManager";
import { GroupCard } from "@/components/GroupCard";
import { useGroup } from "@/contexts/GroupContext";
import { Group } from "@/types/tournament";
import { useState } from "react";

interface GroupSwitcherModalProps {
  trigger?: React.ReactNode;
}

export const GroupSwitcherModal = ({
  trigger,
}: GroupSwitcherModalProps) => {
  const { userGroups, currentGroup, setCurrentGroup } = useGroup();

  const [open, setOpen] = useState(false);



  const handleGroupSelect = (group: Group) => {
    setCurrentGroup(group);
    setOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Users className="w-4 h-4 mr-2" />
      {currentGroup?.name || "Select Group"}
      <ChevronRight className="w-4 h-4 ml-2" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-ping-pong" />
            Group Management
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {userGroups.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold">Your Groups</h3>
              <div className="space-y-2">
                {userGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isActive={currentGroup?.id === group.id}
                    onSelect={handleGroupSelect}
                  />
                ))}
              </div>
            </div>
          )}

          <GroupManager />

          {userGroups.length === 0 && (
            <div className="text-center py-8">
              <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Groups Available</h3>
              <p className="text-muted-foreground">
                Create your first group to get started with tournaments and MMR
                tracking.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
